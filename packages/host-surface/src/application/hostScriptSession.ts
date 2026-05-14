import {
  createAllowlist,
  type CapabilityId,
  InMemoryCapabilityRegistry,
} from '@luarizer/runtime-capabilities';
import type { Result } from '@luarizer/shared';
import type { z } from 'zod';
import {
  createSandboxScript,
  type ExecutionFailure,
  type RunScriptResult,
  type Sandbox,
  type SandboxId,
  type SandboxRuntime,
  type TimeoutPolicy,
} from '@luarizer/runtime-core';

import { augmentHostWithCapabilityRegistry } from '../domain/capabilityRegistrySymbol.js';
import {
  buildBridgeMergeEnvForHost,
  type HostSurface,
  type HostWorkflowHooksSpec,
} from './defineHostSurface.js';
import type { LuaGlobalHookName } from './luaGlobalHook.js';

/**
 * Tuple accepted by {@link HostScriptSession.invokeGlobalHookIfPresent} when the session is specialised with
 * the same Zod map as {@link HostSurface} `workflowHooks` on the surface you pass in.
 */
export type WorkflowHookInvokeArgs<TH extends HostWorkflowHooksSpec> = {
  [K in keyof TH & string]: readonly [hook: LuaGlobalHookName<K>, payload: Readonly<z.infer<TH[K]>>];
}[keyof TH & string];

type InvokeGlobalHookIfPresentFn<THooks extends HostWorkflowHooksSpec | undefined> = THooks extends HostWorkflowHooksSpec
  ? (...args: WorkflowHookInvokeArgs<THooks>) => Promise<Result<RunScriptResult, ExecutionFailure>>
  : (
      globalName: string,
      payload: Readonly<Record<string, string | number | boolean>>,
    ) => Promise<Result<RunScriptResult, ExecutionFailure>>;

/**
 * Options for {@link HostScriptSession}: one Wasm (or other) slot, a surface, host services, and a capability allowlist.
 *
 * @typeParam THost - Your engine context; must match the `THost` used in {@link defineHostSurfaceFor} (or {@link defineHostSurface}) / {@link fn}.
 * @typeParam THooks - When the surface was built with workflow hooks, pass the same `THooks` so {@link HostScriptSession.invokeGlobalHookIfPresent} narrows to those payloads (match `surface`’s `workflowHooks` typing).
 */
export type HostScriptSessionOptions<
  THost,
  THooks extends HostWorkflowHooksSpec | undefined = undefined,
> = {
  /** Shared runtime (typically one Wasmoon VM for many slots). */
  readonly runtime: SandboxRuntime;
  /** Surface produced by {@link defineHostSurface}. */
  readonly surface: HostSurface<THooks>;
  /** Host services passed into bridge handlers (orders, clock, …). */
  readonly host: THost;
  /** Stable sandbox id for this script / workflow / entity. */
  readonly slotKey: SandboxId;
  /** Exact capability ids this session may invoke on any bridge method. */
  readonly allowedCapabilities: readonly CapabilityId[];
  /** Optional default timeout forwarded to {@link Sandbox.run}. */
  readonly defaultTimeout?: TimeoutPolicy | undefined;
};

/**
 * Binds one **Lua slot** to a {@link HostSurface}: capability allowlist, Zod validation, and `mergeEnv` wiring.
 *
 * @remarks
 * - **Lua → host (bridges):** tables/methods from {@link defineHostSurface} on `_ENV` call into TypeScript with Zod validation.
 * - **Host → Lua (globals):** use {@link HostScriptSession.invokeGlobalHookIfPresent} for optional top-level hooks
 *   (e.g. `onOrderPlaced`). For calls on a global table, use {@link HostScriptSession.call}.
 * - Call {@link HostScriptSession.openSession} once before running chunks or invocations; {@link HostScriptSession.dispose} when the slot is torn down.
 *
 * @typeParam THost - Same host type as your surface handlers.
 * @typeParam THooks - Align with {@link HostSurface} `workflowHooks` on the surface you pass in (or `undefined` when the surface has no workflow hooks).
 */
export class HostScriptSession<
  THost,
  THooks extends HostWorkflowHooksSpec | undefined = undefined,
> {
  private sandbox: Sandbox | undefined;

  private readonly registry: InMemoryCapabilityRegistry;

  constructor(private readonly opts: HostScriptSessionOptions<THost, THooks>) {
    this.registry = new InMemoryCapabilityRegistry(createAllowlist([...opts.allowedCapabilities]));
  }

  /**
   * Allocates the underlying {@link Sandbox} for this `slotKey` on the shared runtime.
   */
  readonly openSession = async (): Promise<void> => {
    this.sandbox = await this.opts.runtime.createSandbox({ slotKey: this.opts.slotKey });
  };

  /**
   * Exposes the in-memory registry (e.g. to mutate allowlists in advanced tests).
   */
  readonly getCapabilityRegistry = (): InMemoryCapabilityRegistry => this.registry;

  private requireSandbox(): Sandbox {
    if (this.sandbox === undefined) {
      throw new Error('HostScriptSession: openSession() was not called');
    }
    return this.sandbox;
  }

  private mergeEnv() {
    const host = augmentHostWithCapabilityRegistry(this.opts.host, this.registry);
    return buildBridgeMergeEnvForHost(host, String(this.opts.slotKey), this.opts.surface);
  }

  /**
   * Executes Lua source in the slot environment with surface bridges on `_ENV`.
   *
   * @param source - Full Lua chunk (compiled with `load(..., "t", env)` in the Wasm adapter).
   */
  readonly runChunk = async (source: string) => {
    const sb = this.requireSandbox();
    return sb.run({
      script: createSandboxScript(source),
      mergeEnv: this.mergeEnv(),
      timeout: this.opts.defaultTimeout,
    });
  };

  /**
   * Host → Lua: invokes `_ENV[globalName](literalTable)` when that entry is a function; otherwise no-op.
   * Prefer this over hand-built Lua chunks for workflow hooks (`onOrderPlaced`, …).
   *
   * When the class is specialised with `THooks` (e.g. `HostScriptSession<Host, typeof workflowHooks>`),
   * arguments are a hook name from that spec plus the inferred Zod payload. Otherwise `globalName` and a
   * plain literal table are accepted.
   *
   * @param globalName - Must be a safe Lua identifier (`/^[A-Za-z_][A-Za-z0-9_]*$/`).
   * @param payload - Table fields: only string, finite number, or boolean (Lua literals).
   */
  readonly invokeGlobalHookIfPresent = (async (
    globalName: string,
    payload: Readonly<Record<string, string | number | boolean>>,
  ) => {
    assertSafeLuaGlobalName(globalName);
    const sb = this.requireSandbox();
    const tbl = luaTableLiteralFromPlainRecord(payload);
    const src = [
      `local f = rawget(_ENV, ${JSON.stringify(globalName)})`,
      `if type(f) == "function" then`,
      `  f(${tbl})`,
      `end`,
    ].join('\n');
    return sb.run({
      script: createSandboxScript(src),
      mergeEnv: this.mergeEnv(),
      timeout: this.opts.defaultTimeout,
    });
  }) as InvokeGlobalHookIfPresentFn<THooks>;

  /**
   * Host → Lua: invokes `_ENV[tableName][methodName](literalTable)` where `literalTable` is built only from
   * string, finite number, or boolean fields in `payload`.
   *
   * @param tableName - Global table name in the slot env.
   * @param methodName - Function field on that table.
   * @param payload - Plain serializable fields for the Lua table literal.
   */
  readonly call = async (tableName: string, methodName: string, payload: Record<string, unknown>) => {
    const sb = this.requireSandbox();
    const tbl = luaTableLiteralFromUnknownRecord(payload);
    const src = [
      `local t = _ENV[${JSON.stringify(tableName)}]`,
      `local f = type(t) == "table" and t[${JSON.stringify(methodName)}] or nil`,
      `if type(f) == "function" then`,
      `  f(${tbl})`,
      `end`,
    ].join('\n');
    return sb.run({
      script: createSandboxScript(src),
      mergeEnv: this.mergeEnv(),
      timeout: this.opts.defaultTimeout,
    });
  };

  /**
   * Releases the slot in the runtime adapter and clears the session handle.
   */
  readonly dispose = async (): Promise<void> => {
    if (this.sandbox !== undefined) {
      await this.sandbox.dispose();
      this.sandbox = undefined;
    }
  };
}

function assertSafeLuaGlobalName(name: string): void {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`unsafe Lua global name: ${name}`);
  }
}

function luaTableLiteralFromPlainRecord(o: Readonly<Record<string, string | number | boolean>>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'string') {
      parts.push(`${k} = ${JSON.stringify(v)}`);
    } else if (typeof v === 'number' && Number.isFinite(v)) {
      parts.push(`${k} = ${v}`);
    } else if (typeof v === 'boolean') {
      parts.push(`${k} = ${v ? 'true' : 'false'}`);
    } else {
      throw new Error(`HostScriptSession: unsupported value type for key ${k}`);
    }
  }
  return `{ ${parts.join(', ')} }`;
}

function luaTableLiteralFromUnknownRecord(o: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'string') {
      parts.push(`${k} = ${JSON.stringify(v)}`);
    } else if (typeof v === 'number' && Number.isFinite(v)) {
      parts.push(`${k} = ${v}`);
    } else if (typeof v === 'boolean') {
      parts.push(`${k} = ${v ? 'true' : 'false'}`);
    } else {
      throw new Error(`HostScriptSession.call: unsupported value type for key ${k}`);
    }
  }
  return `{ ${parts.join(', ')} }`;
}
