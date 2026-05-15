import type { z } from 'zod';

import {
  HostScriptSession,
  luaGlobalHookName,
  type HostSurface,
  type HostSurfaceCore,
  type HostWorkflowHooksSpec,
} from '@microverse/host-surface';
import type { CapabilityId } from '@microverse/runtime-capabilities';
import { createLuaEnvSlotKey, type MicroverseRuntime, type TimeoutPolicy } from '@microverse/runtime-core';
import { createWasmMicroverseRuntime } from '@microverse/runtime-wasm';

/** Phantom key: optional on the host **type** so {@link InferScriptHooksFromHost} can recover hook Zod map typing. Never set at runtime. */
declare const SCRIPT_HOOKS_TYPE: unique symbol;

/**
 * Intersects `TBase` with an optional phantom field carrying `THooks` for {@link LuaMicroverse} / {@link createLuaMicroverse} inference.
 */
export type TaggedLuaMicroverseHost<
  THooks extends HostWorkflowHooksSpec,
  TBase = unknown,
> = TBase & { readonly [SCRIPT_HOOKS_TYPE]?: THooks };

/** @deprecated Use {@link TaggedLuaMicroverseHost}. */
export type TaggedWorkflowHost<
  THooks extends HostWorkflowHooksSpec,
  TBase = unknown,
> = TaggedLuaMicroverseHost<THooks, TBase>;

export type InferScriptHooksFromHost<THost> = THost extends TaggedLuaMicroverseHost<infer H, unknown>
  ? H extends HostWorkflowHooksSpec
    ? H
    : undefined
  : undefined;

/** @deprecated Use {@link InferScriptHooksFromHost}. */
export type InferWorkflowHooksFromHost<THost> = InferScriptHooksFromHost<THost>;

export type InferScriptHooksFromSurface<S extends HostSurfaceCore> =
  S extends HostSurfaceCore<CapabilityId> & { readonly workflowHooks: infer H extends HostWorkflowHooksSpec }
    ? H
    : S extends HostSurface<infer H extends HostWorkflowHooksSpec, CapabilityId>
      ? H
      : undefined;

/** @deprecated Use {@link InferScriptHooksFromSurface}. */
export type InferWorkflowHooksFromSurface<S extends HostSurfaceCore> = InferScriptHooksFromSurface<S>;

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
  THooks extends HostWorkflowHooksSpec | undefined = InferScriptHooksFromHost<THost>,
  TCapabilities extends CapabilityId = CapabilityId,
> = {
  readonly host: THost;
  /** From {@link defineHostSurface} / {@link defineHostSurfaceFor}; hooks live on `surface.workflowHooks` when present. */
  readonly surface: HostSurface<THooks, TCapabilities>;
  /** Prefix for internal Lua env slot ids, default `script` (ids look like `script:my-id`). */
  readonly envSlotScope?: string | undefined;
  /** Wall-clock limit per `runChunk` / hook invocation (Wasm adapter + session forwarding). */
  readonly defaultTimeout?: TimeoutPolicy | undefined;
  /**
   * Lua sources run in **every** script slot after {@link HostScriptSession.openSession} and before that
   * script's main chunk. Define shared helpers/libraries here once instead of per {@link registerScript}.
   */
  readonly sharedLuaChunks?: readonly string[] | undefined;
};

/** @deprecated Use {@link LuaMicroverseConfig}. */
export type HostWorkflowHubConfig<
  THost extends object = object,
  THooks extends HostWorkflowHooksSpec | undefined = InferScriptHooksFromHost<THost>,
> = LuaMicroverseConfig<THost, THooks>;

type EmitToAllScriptsFn<THooks extends HostWorkflowHooksSpec | undefined> = THooks extends HostWorkflowHooksSpec
  ? <const K extends keyof THooks & string>(kind: K, payload: Readonly<z.infer<THooks[K]>>) => Promise<void>
  : (
      kind: string,
      payload: Readonly<Record<string, string | number | boolean>>,
    ) => Promise<void>;

/**
 * One **Lua microverse**: a shared built-in Wasm Lua VM, {@link HostScriptSession}s keyed by `scriptId`, and helpers to
 * register scripts and broadcast hook events. Capabilities per script come from the host surface
 * ({@link HostSurfaceCore.pickCapabilities} / {@link HostSurfaceCore.capabilities}). Created via {@link MicroverseLua.create}
 * or {@link createLuaMicroverse}.
 */
export class LuaMicroverse<
  THost extends object = object,
  THooks extends HostWorkflowHooksSpec | undefined = InferScriptHooksFromHost<THost>,
  TCapabilities extends CapabilityId = CapabilityId,
> {
  private readonly runtime: MicroverseRuntime;

  private readonly sessions = new Map<string, HostScriptSession<THost, THooks>>();

  private readonly host: THost;

  private readonly surface: HostSurface<THooks, TCapabilities>;

  private readonly envSlotScope: string;

  private readonly defaultTimeout: TimeoutPolicy | undefined;

  private readonly sharedLuaChunks: readonly string[];

  constructor(private readonly config: LuaMicroverseConfig<THost, THooks, TCapabilities>) {
    this.host = config.host;
    this.surface = config.surface;
    this.defaultTimeout = config.defaultTimeout;
    this.sharedLuaChunks = config.sharedLuaChunks ?? [];
    this.runtime = createWasmMicroverseRuntime(
      config.defaultTimeout !== undefined ? { defaultTimeout: config.defaultTimeout } : {},
    );
    this.envSlotScope = config.envSlotScope ?? 'script';
  }

  /** Capability ids declared on the bound host surface. */
  readonly getSurfaceCapabilities = (): readonly TCapabilities[] => this.surface.capabilities;

  /**
   * Loads one Lua chunk in an isolated env slot; `scriptId` must be unique within this microverse.
   *
   * @param args.capabilities - Subset of {@link getSurfaceCapabilities}; use `surface.pickCapabilities(…)` at the call site.
   */
  readonly registerScript = async (args: {
    readonly scriptId: string;
    readonly script: string;
    readonly capabilities: readonly TCapabilities[];
    readonly injectLuaChunks?: readonly string[] | undefined;
  }): Promise<void> => {
    const { scriptId, script, capabilities, injectLuaChunks } = args;
    const preludeChunks = [...this.sharedLuaChunks, ...(injectLuaChunks ?? [])];
    if (this.sessions.has(scriptId)) {
      throw new Error(`script already registered: ${scriptId}`);
    }
    const session = new HostScriptSession<THost, THooks>({
      runtime: this.runtime,
      surface: this.surface,
      host: this.host,
      slotKey: createLuaEnvSlotKey(`${this.envSlotScope}:${scriptId}`),
      allowedCapabilities: capabilities,
      defaultTimeout: this.defaultTimeout,
    });
    await session.openSession();
    for (const [index, chunk] of preludeChunks.entries()) {
      const injected = await session.runChunk(chunk);
      if (injected._tag !== 'ok') {
        await session.dispose();
        const detail =
          injected._tag === 'err' && injected.error._tag === 'AdapterError'
            ? injected.error.message
            : JSON.stringify(injected.error);
        const which =
          index < this.sharedLuaChunks.length
            ? `shared Lua prelude [${index}]`
            : `script injectLuaChunks [${index - this.sharedLuaChunks.length}]`;
        throw new Error(`script "${scriptId}" failed injecting ${which}: ${detail}`);
      }
    }
    const loaded = await session.runChunk(script);
    if (loaded._tag !== 'ok') {
      await session.dispose();
      const detail =
        loaded._tag === 'err' && loaded.error._tag === 'AdapterError'
          ? loaded.error.message
          : JSON.stringify(loaded.error);
      throw new Error(`script "${scriptId}" failed to load: ${detail}`);
    }
    this.sessions.set(scriptId, session);
  };

  /** Invokes `on{Kind}` on every registered script with the same payload table (Lua literals only). */
  readonly emitToAllScripts = (async (
    kind: string,
    payload: Readonly<Record<string, string | number | boolean>>,
  ) => {
    const hook = luaGlobalHookName(kind);
    for (const [id, session] of this.sessions) {
      const r = await session.invokeGlobalHookIfPresent(hook, payload);
      if (r._tag !== 'ok') {
        const detail =
          r._tag === 'err' && r.error._tag === 'AdapterError' ? r.error.message : JSON.stringify(r.error);
        throw new Error(`script "${id}" failed on emit: ${detail}`);
      }
    }
  }) as EmitToAllScriptsFn<THooks>;

  readonly dispose = async (): Promise<void> => {
    for (const s of this.sessions.values()) {
      await s.dispose();
    }
    this.sessions.clear();
  };
}

/** @deprecated Use {@link LuaMicroverse}. */
export type HostWorkflowHub<
  THost extends object = object,
  THooks extends HostWorkflowHooksSpec | undefined = InferScriptHooksFromHost<THost>,
  TCapabilities extends CapabilityId = CapabilityId,
> = LuaMicroverse<THost, THooks, TCapabilities>;

/**
 * Creates a {@link LuaMicroverse} with a **built-in** Wasm Lua VM (Wasmoon). Type `host` with
 * {@link TaggedLuaMicroverseHost} so hook emits narrow correctly. Prefer {@link MicroverseLua.create} for the same API.
 */
export function createLuaMicroverse<
  THost extends object,
  const TSurface extends HostSurfaceCore<CapabilityId>,
>(config: {
  readonly host: THost;
  readonly surface: TSurface;
  readonly envSlotScope?: string | undefined;
  readonly defaultTimeout?: TimeoutPolicy | undefined;
  readonly sharedLuaChunks?: readonly string[] | undefined;
}): LuaMicroverse<THost, EffectiveScriptHooks<THost, TSurface>, InferSurfaceCapabilitiesFromSurface<TSurface>> {
  type H = EffectiveScriptHooks<THost, TSurface>;
  type C = InferSurfaceCapabilitiesFromSurface<TSurface>;
  return new LuaMicroverse<THost, H, C>({
    host: config.host,
    surface: config.surface as unknown as HostSurface<H, C>,
    envSlotScope: config.envSlotScope,
    defaultTimeout: config.defaultTimeout,
    sharedLuaChunks: config.sharedLuaChunks,
  });
}

/** @deprecated Use {@link createLuaMicroverse}. */
export const createHostWorkflowHub = createLuaMicroverse;
