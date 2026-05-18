import type { z } from 'zod';

import {
  HostScriptSession,
  luaGlobalHookName,
  resolveScriptProfile,
  type HostSurface,
  type HostSurfaceCore,
  type HostComponentHooksSpec,
  type ResolvedScriptProfile,
} from '@microverse.ts/host-surface';
import type { CapabilityId } from '@microverse.ts/runtime-capabilities';
import {
  createLuaEnvSlotKey,
  createScriptInstanceContext,
  fixedTimeout,
  mergeScriptPropertyBags,
  formatExecutionFailure,
  resolveLuaScriptProfileId,
  resolveLuaScriptSource,
  type ExecutionFailure,
  type LuaScriptDefinition,
  type MicroverseRuntime,
  type ScriptAuditEvent,
  type ScriptPropertyBag,
  type TimeoutPolicy,
} from '@microverse.ts/runtime-core';
import { createWasmMicroverseRuntime } from '@microverse.ts/runtime-wasm';

/** Phantom key: optional on the host **type** so {@link InferScriptHooksFromHost} can recover hook Zod map typing. Never set at runtime. */
declare const SCRIPT_HOOKS_TYPE: unique symbol;

export type TaggedLuaMicroverseHost<
  THooks extends HostComponentHooksSpec,
  TBase = unknown,
> = TBase & { readonly [SCRIPT_HOOKS_TYPE]?: THooks };

export type InferScriptHooksFromHost<THost> = THost extends TaggedLuaMicroverseHost<infer H, unknown>
  ? H extends HostComponentHooksSpec
    ? H
    : undefined
  : undefined;

export type InferScriptHooksFromSurface<S extends HostSurfaceCore> =
  S extends HostSurfaceCore<CapabilityId> & { readonly componentHooks: infer H extends HostComponentHooksSpec }
    ? H
    : S extends HostSurface<infer H extends HostComponentHooksSpec, CapabilityId>
      ? H
      : undefined;

export type InferSurfaceCapabilitiesFromSurface<S extends HostSurfaceCore> = S extends HostSurfaceCore<
  infer C extends CapabilityId
>
  ? C
  : CapabilityId;

type EffectiveScriptHooks<THost extends object, TSurface extends HostSurfaceCore> = [InferScriptHooksFromHost<THost>] extends [
  undefined,
]
  ? InferScriptHooksFromSurface<TSurface>
  : InferScriptHooksFromHost<THost>;

export type LuaMicroverseConfig<
  THost extends object = object,
  THooks extends HostComponentHooksSpec | undefined = InferScriptHooksFromHost<THost>,
  TCapabilities extends CapabilityId = CapabilityId,
> = {
  readonly host: THost;
  readonly surface: HostSurface<THooks, TCapabilities>;
  readonly envSlotScope?: string | undefined;
  readonly defaultTimeout?: TimeoutPolicy | undefined;
  readonly defaultTimeoutMs?: number | undefined;
  readonly sharedLuaChunks?: readonly string[] | undefined;
  readonly onScriptAudit?: ((event: ScriptAuditEvent) => void) | undefined;
};

function resolveDefaultTimeout<
  THost extends object,
  THooks extends HostComponentHooksSpec | undefined,
  TCapabilities extends CapabilityId,
>(config: LuaMicroverseConfig<THost, THooks, TCapabilities>): TimeoutPolicy | undefined {
  if (config.defaultTimeout !== undefined) {
    return config.defaultTimeout;
  }
  if (config.defaultTimeoutMs !== undefined) {
    return fixedTimeout(config.defaultTimeoutMs);
  }
  return undefined;
}

type EmitToAllInstancesFn<THooks extends HostComponentHooksSpec | undefined> = THooks extends HostComponentHooksSpec
  ? <const K extends keyof THooks & string>(kind: K, payload: Readonly<z.infer<THooks[K]>>) => Promise<void>
  : (
      kind: string,
      payload: Readonly<Record<string, string | number | boolean>>,
    ) => Promise<void>;

type MountedInstance = {
  readonly session: HostScriptSession<unknown, HostComponentHooksSpec | undefined>;
};

export class LuaMicroverse<
  THost extends object = object,
  THooks extends HostComponentHooksSpec | undefined = InferScriptHooksFromHost<THost>,
  TCapabilities extends CapabilityId = CapabilityId,
> {
  private readonly runtime: MicroverseRuntime;

  private readonly definitions = new Map<string, LuaScriptDefinition>();

  private readonly instances = new Map<string, MountedInstance>();

  private readonly host: THost;

  private readonly surface: HostSurface<THooks, TCapabilities>;

  private readonly envSlotScope: string;

  private readonly defaultTimeout: TimeoutPolicy | undefined;

  private readonly sharedLuaChunks: readonly string[];

  private readonly onScriptAudit: ((event: ScriptAuditEvent) => void) | undefined;

  constructor(private readonly config: LuaMicroverseConfig<THost, THooks, TCapabilities>) {
    this.host = config.host;
    this.surface = config.surface;
    this.defaultTimeout = resolveDefaultTimeout(config);
    this.sharedLuaChunks = config.sharedLuaChunks ?? [];
    this.onScriptAudit = config.onScriptAudit;
    this.runtime = createWasmMicroverseRuntime(
      this.defaultTimeout !== undefined ? { defaultTimeout: this.defaultTimeout } : {},
    );
    this.envSlotScope = config.envSlotScope ?? 'script';
  }

  readonly getSurfaceCapabilities = (): readonly TCapabilities[] => this.surface.capabilities;

  readonly registerScriptDefinition = (def: LuaScriptDefinition): void => {
    if (this.definitions.has(def.scriptId)) {
      throw new Error(`script definition already registered: ${def.scriptId}`);
    }
    this.definitions.set(def.scriptId, def);
  };

  readonly hasScriptDefinition = (scriptId: string): boolean => this.definitions.has(scriptId);

  readonly getScriptDefinition = (scriptId: string): LuaScriptDefinition | undefined =>
    this.definitions.get(scriptId);

  readonly mountScriptInstance = async (args: {
    readonly instanceId: string;
    readonly scriptId: string;
    readonly script?: string | undefined;
    readonly props?: ScriptPropertyBag | undefined;
    readonly audit?: Readonly<Record<string, string | number | boolean>> | undefined;
    readonly injectLuaChunks?: readonly string[] | undefined;
    /** Overrides {@link LuaScriptDefinition.profileId} for this mount. */
    readonly profileId?: string | undefined;
    /** Lua global for `Type:extend()` when using an inline {@link LuaScriptDefinition.profile}. */
    readonly profileSingleton?: string | undefined;
  }): Promise<void> => {
    const { instanceId, scriptId, audit, injectLuaChunks } = args;
    if (this.instances.has(instanceId)) {
      throw new Error(`script instance already mounted: ${instanceId}`);
    }

    let def = this.definitions.get(scriptId);
    if (def === undefined) {
      if (args.script === undefined) {
        throw new Error(`unknown scriptId "${scriptId}" and no inline script provided`);
      }
      def = {
        scriptId,
        source: args.script,
      };
      this.definitions.set(scriptId, def);
    } else if (args.script !== undefined) {
      def = { ...def, source: args.script };
    }

    const profileId = args.profileId ?? resolveLuaScriptProfileId(def);
    let resolvedProfile: ResolvedScriptProfile | undefined;
    if (def.profile !== undefined) {
      const profileName = profileId ?? args.profileSingleton ?? scriptId;
      resolvedProfile = resolveScriptProfile(
        { [profileName]: def.profile },
        profileName,
        this.surface.getHostSurfaceSpec(),
      );
    } else if (profileId !== undefined) {
      this.surface.getComponentType(profileId);
    }

    const profileSingleton =
      args.profileSingleton ??
      (def.profile !== undefined && profileId !== undefined ? profileId : undefined);

    const slotKey = createLuaEnvSlotKey(`${this.envSlotScope}:${instanceId}`);
    const scriptContext = createScriptInstanceContext({
      instanceId,
      scriptId,
      slotKey: String(slotKey),
      audit,
    });

    const session = new HostScriptSession<THost, THooks>({
      runtime: this.runtime,
      surface: this.surface,
      host: this.host,
      slotKey,
      defaultTimeout: this.defaultTimeout,
      script: scriptContext,
      profileId: resolvedProfile?.name ?? profileId,
      resolvedProfile,
      profileSingleton,
      onScriptAudit: this.onScriptAudit,
    });

    try {
      await session.openSession();
      const preludeChunks = [
        ...this.sharedLuaChunks,
        ...(def.injectLuaChunks ?? []),
        ...(injectLuaChunks ?? []),
      ];
      for (const [index, chunk] of preludeChunks.entries()) {
        const injected = await session.runChunk(chunk);
        if (injected._tag !== 'ok') {
          throw new Error(formatRunError(instanceId, `prelude [${index}]`, injected));
        }
      }

      const source = await resolveLuaScriptSource(def.source);
      const loaded = await session.runChunk(source);
      if (loaded._tag !== 'ok') {
        throw new Error(formatRunError(instanceId, 'main chunk', loaded));
      }

      const mergedProps = mergeScriptPropertyBags(def.defaultProps ?? {}, args.props ?? {});
      await session.setProps(mergedProps);
      const initResult = await session.invokeComponentHook('init');
      if (initResult._tag !== 'ok') {
        throw new Error(formatRunError(instanceId, 'init hook', initResult));
      }

      this.instances.set(instanceId, { session });
      this.onScriptAudit?.({ kind: 'mounted', context: scriptContext });
    } catch (e) {
      await session.dispose();
      const message = e instanceof Error ? e.message : String(e);
      this.onScriptAudit?.({
        kind: 'scriptError',
        context: scriptContext,
        phase: 'mount',
        message,
      });
      throw e;
    }
  };

  readonly unmountScriptInstance = async (instanceId: string): Promise<void> => {
    const mounted = this.instances.get(instanceId);
    if (mounted === undefined) {
      throw new Error(`script instance not mounted: ${instanceId}`);
    }
    const ctx = mounted.session.context;
    await mounted.session.dispose();
    this.instances.delete(instanceId);
    this.onScriptAudit?.({ kind: 'unmounted', context: ctx });
  };

  readonly setInstanceProps = async (instanceId: string, bag: ScriptPropertyBag): Promise<void> => {
    const session = this.requireInstance(instanceId);
    await session.setProps(bag);
  };

  readonly patchInstanceProps = async (
    instanceId: string,
    partial: ScriptPropertyBag,
  ): Promise<void> => {
    const session = this.requireInstance(instanceId);
    await session.patchProps(partial);
  };

  readonly getInstanceProps = (instanceId: string): Readonly<ScriptPropertyBag> => {
    return this.requireInstance(instanceId).getProps();
  };

  readonly flushInstanceProps = async (instanceId: string): Promise<ScriptPropertyBag | null> => {
    return this.requireInstance(instanceId).flushDirtyProps();
  };

  readonly getInstance = (instanceId: string): HostScriptSession<THost, THooks> | undefined => {
    return this.instances.get(instanceId)?.session as HostScriptSession<THost, THooks> | undefined;
  };

  readonly emitToAllInstances = (async (
    kind: string,
    payload: Readonly<Record<string, string | number | boolean>>,
  ) => {
    const hook = luaGlobalHookName(kind);
    for (const [id, { session }] of this.instances) {
      const r = await session.invokeComponentEventHook(hook, payload);
      if (r._tag !== 'ok') {
        const detail =
          r._tag === 'err' && r.error._tag === 'AdapterError' ? r.error.message : JSON.stringify(r.error);
        throw new Error(`instance "${id}" failed on emit: ${detail}`);
      }
    }
  }) as EmitToAllInstancesFn<THooks>;

  readonly dispose = async (): Promise<void> => {
    for (const id of [...this.instances.keys()]) {
      await this.unmountScriptInstance(id);
    }
    this.instances.clear();
  };

  private requireInstance(instanceId: string): HostScriptSession<THost, THooks> {
    const mounted = this.instances.get(instanceId);
    if (mounted === undefined) {
      throw new Error(`script instance not mounted: ${instanceId}`);
    }
    return mounted.session as HostScriptSession<THost, THooks>;
  }
}

function formatRunError(
  instanceId: string,
  phase: string,
  result: { readonly _tag: 'err'; readonly error: ExecutionFailure },
): string {
  return `instance "${instanceId}" failed ${phase}: ${formatExecutionFailure(result.error)}`;
}

export function createLuaMicroverse<
  THost extends object,
  const TSurface extends HostSurfaceCore<CapabilityId>,
>(config: {
  readonly host: THost;
  readonly surface: TSurface;
  readonly envSlotScope?: string | undefined;
  readonly defaultTimeout?: TimeoutPolicy | undefined;
  readonly defaultTimeoutMs?: number | undefined;
  readonly sharedLuaChunks?: readonly string[] | undefined;
  readonly onScriptAudit?: ((event: ScriptAuditEvent) => void) | undefined;
}): LuaMicroverse<THost, EffectiveScriptHooks<THost, TSurface>, InferSurfaceCapabilitiesFromSurface<TSurface>> {
  type H = EffectiveScriptHooks<THost, TSurface>;
  type C = InferSurfaceCapabilitiesFromSurface<TSurface>;
  return new LuaMicroverse<THost, H, C>({
    host: config.host,
    surface: config.surface as unknown as HostSurface<H, C>,
    envSlotScope: config.envSlotScope,
    defaultTimeout: config.defaultTimeout,
    defaultTimeoutMs: config.defaultTimeoutMs,
    sharedLuaChunks: config.sharedLuaChunks,
    onScriptAudit: config.onScriptAudit,
  });
}
