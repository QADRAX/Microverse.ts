import type { z } from 'zod';

import {
  HostScriptSession,
  luaGlobalHookName,
  type HostSurface,
  type HostSurfaceCore,
  type HostWorkflowHooksSpec,
} from '@luarizer/host-surface';
import type { CapabilityId } from '@luarizer/runtime-capabilities';
import { createLuaEnvSlotKey, type SandboxRuntime, type TimeoutPolicy } from '@luarizer/runtime-core';
import { createWasmSandboxRuntime } from '@luarizer/runtime-wasm';

/** Phantom key: optional on the host **type** so {@link InferWorkflowHooksFromHost} can recover workflow Zod map typing. Never set at runtime. */
declare const WORKFLOW_HOOKS_TYPE: unique symbol;

/**
 * Intersects `TBase` with an optional phantom field carrying `THooks` for {@link HostWorkflowHub} / {@link createHostWorkflowHub} inference.
 *
 * @example
 * ```ts
 * type MyHost = TaggedWorkflowHost<typeof myWorkflowHooks, { readonly clock: Clock }>;
 * ```
 */
export type TaggedWorkflowHost<
  THooks extends HostWorkflowHooksSpec,
  TBase = unknown,
> = TBase & { readonly [WORKFLOW_HOOKS_TYPE]?: THooks };

/**
 * Reads workflow hook typing from a host built with {@link TaggedWorkflowHost}.
 */
export type InferWorkflowHooksFromHost<THost> = THost extends TaggedWorkflowHost<infer H, infer _Rest>
  ? H extends HostWorkflowHooksSpec
    ? H
    : undefined
  : undefined;

/**
 * Reads workflow hook typing from a {@link HostSurface} that was built with a `workflowHooks` field.
 */
export type InferWorkflowHooksFromSurface<S extends HostSurfaceCore> =
  S extends HostSurfaceCore & { readonly workflowHooks: infer H extends HostWorkflowHooksSpec }
    ? H
    : undefined;

type EffectiveWorkflowHooks<THost extends object, TSurface extends HostSurfaceCore> =
  [InferWorkflowHooksFromHost<THost>] extends [undefined]
    ? InferWorkflowHooksFromSurface<TSurface>
    : InferWorkflowHooksFromHost<THost>;

export type HostWorkflowHubConfig<
  THost extends object = object,
  THooks extends HostWorkflowHooksSpec | undefined = InferWorkflowHooksFromHost<THost>,
> = {
  readonly host: THost;
  /** From {@link defineHostSurface} / {@link defineHostSurfaceFor}; hooks live on `surface.workflowHooks` when present. */
  readonly surface: HostSurface<THooks>;
  /** When omitted, a Wasm-backed {@link SandboxRuntime} is created for this hub. */
  readonly runtime?: SandboxRuntime | undefined;
  /** Prefix for internal Lua env slot ids, default `workflow` (ids look like `workflow:my-id`). */
  readonly envSlotScope?: string | undefined;
  /** Wall-clock limit per `runChunk` / workflow hook invocation (Wasm adapter + session forwarding). */
  readonly defaultTimeout?: TimeoutPolicy | undefined;
};

type EmitToAllWorkflowsFn<THooks extends HostWorkflowHooksSpec | undefined> = THooks extends HostWorkflowHooksSpec
  ? <const K extends keyof THooks & string>(kind: K, payload: Readonly<z.infer<THooks[K]>>) => Promise<void>
  : (
      kind: string,
      payload: Readonly<Record<string, string | number | boolean>>,
    ) => Promise<void>;

/**
 * Owns one {@link SandboxRuntime}, a map of {@link HostScriptSession}s keyed by `workflowId`, and helpers to
 * register Lua + emit workflow hooks across all sessions — intended as the default host integration surface
 * instead of wiring `createSandbox` / `slotKey` / `Map` by hand. Each `workflowId` gets an isolated Lua env slot,
 * so many workflows run concurrently without sharing handler state.
 *
 * @typeParam THost - Use {@link TaggedWorkflowHost} so `emitToAllWorkflows` narrows to your workflow Zod map without a second generic.
 */
export class HostWorkflowHub<
  THost extends object = object,
  THooks extends HostWorkflowHooksSpec | undefined = InferWorkflowHooksFromHost<THost>,
> {
  private readonly runtime: SandboxRuntime;

  private readonly sessions = new Map<string, HostScriptSession<THost, THooks>>();

  private readonly host: THost;

  private readonly surface: HostSurface<THooks>;

  private readonly envSlotScope: string;

  private readonly defaultTimeout: TimeoutPolicy | undefined;

  constructor(private readonly config: HostWorkflowHubConfig<THost, THooks>) {
    this.host = config.host;
    this.surface = config.surface;
    this.defaultTimeout = config.defaultTimeout;
    this.runtime =
      config.runtime ??
      createWasmSandboxRuntime(
        config.defaultTimeout !== undefined ? { defaultTimeout: config.defaultTimeout } : {},
      );
    this.envSlotScope = config.envSlotScope ?? 'workflow';
  }

  /** Shared Lua VM / adapter used by every workflow session in this hub. */
  readonly getRuntime = (): SandboxRuntime => this.runtime;

  /**
   * Loads one Lua chunk in an isolated env slot; `workflowId` must be unique within this hub.
   *
   * @param args.injectLuaChunks - Optional Lua sources run in order after `openSession` and before `script`
   *   (e.g. pure global helpers under `lua/lib/` without string concatenation).
   */
  readonly registerWorkflow = async (args: {
    readonly workflowId: string;
    readonly script: string;
    readonly allowedCapabilities: readonly CapabilityId[];
    readonly injectLuaChunks?: readonly string[] | undefined;
  }): Promise<void> => {
    const { workflowId, script, allowedCapabilities, injectLuaChunks } = args;
    if (this.sessions.has(workflowId)) {
      throw new Error(`workflow already registered: ${workflowId}`);
    }
    const session = new HostScriptSession<THost, THooks>({
      runtime: this.runtime,
      surface: this.surface,
      host: this.host,
      slotKey: createLuaEnvSlotKey(`${this.envSlotScope}:${workflowId}`),
      allowedCapabilities,
      defaultTimeout: this.defaultTimeout,
    });
    await session.openSession();
    for (const chunk of injectLuaChunks ?? []) {
      const injected = await session.runChunk(chunk);
      if (injected._tag !== 'ok') {
        await session.dispose();
        const detail =
          injected._tag === 'err' && injected.error._tag === 'AdapterError'
            ? injected.error.message
            : JSON.stringify(injected.error);
        throw new Error(`workflow "${workflowId}" failed injecting prelude: ${detail}`);
      }
    }
    const loaded = await session.runChunk(script);
    if (loaded._tag !== 'ok') {
      await session.dispose();
      const detail =
        loaded._tag === 'err' && loaded.error._tag === 'AdapterError'
          ? loaded.error.message
          : JSON.stringify(loaded.error);
      throw new Error(`workflow "${workflowId}" failed to load: ${detail}`);
    }
    this.sessions.set(workflowId, session);
  };

  /**
   * Invokes `on{Kind}` on every registered workflow with the same payload table (Lua literals only).
   * When the surface carries `workflowHooks`, `kind` + `payload` are checked against that Zod map.
   */
  readonly emitToAllWorkflows = (async (
    kind: string,
    payload: Readonly<Record<string, string | number | boolean>>,
  ) => {
    const hook = luaGlobalHookName(kind);
    for (const [id, session] of this.sessions) {
      const r = await session.invokeGlobalHookIfPresent(hook, payload);
      if (r._tag !== 'ok') {
        const detail =
          r._tag === 'err' && r.error._tag === 'AdapterError' ? r.error.message : JSON.stringify(r.error);
        throw new Error(`workflow "${id}" failed on emit: ${detail}`);
      }
    }
  }) as EmitToAllWorkflowsFn<THooks>;

  readonly dispose = async (): Promise<void> => {
    for (const s of this.sessions.values()) {
      await s.dispose();
    }
    this.sessions.clear();
  };
}

/**
 * Creates a {@link HostWorkflowHub}. Prefer typing `host` with {@link TaggedWorkflowHost} so the hub is
 * {@link HostWorkflowHub}`<THost>` only. If the host omits the tag, hook typing falls back to `surface.workflowHooks`.
 */
export function createHostWorkflowHub<THost extends object, const TSurface extends HostSurfaceCore>(config: {
  readonly host: THost;
  readonly surface: TSurface;
  readonly runtime?: SandboxRuntime | undefined;
  readonly envSlotScope?: string | undefined;
  readonly defaultTimeout?: TimeoutPolicy | undefined;
}): HostWorkflowHub<THost, EffectiveWorkflowHooks<THost, TSurface>> {
  type H = EffectiveWorkflowHooks<THost, TSurface>;
  return new HostWorkflowHub<THost, H>({
    host: config.host,
    surface: config.surface as unknown as HostSurface<H>,
    runtime: config.runtime,
    envSlotScope: config.envSlotScope,
    defaultTimeout: config.defaultTimeout,
  });
}
