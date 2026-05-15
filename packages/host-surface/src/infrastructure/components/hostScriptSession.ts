import {
  createAllowlist,
  type CapabilityId,
  InMemoryCapabilityRegistry,
} from '@microverse/runtime-capabilities';
import type { Result } from '@microverse/shared';
import type { z } from 'zod';
import {
  createMicroverseScript,
  type ExecutionFailure,
  type RunScriptResult,
  type MicroverseSlot,
  type MicroverseId,
  type MicroverseRuntime,
  type TimeoutPolicy,
} from '@microverse/runtime-core';

import { augmentHostWithCapabilityRegistry } from '../adapters/augmentHostWithCapabilityRegistry.js';
import { buildBridgeMergeEnvForHost } from '../builders/bridgeMergeEnv.js';
import type { HostSurface, HostWorkflowHooksSpec } from '../../domain/hostSurfaceTypes.js';
import type { LuaGlobalHookName } from '../../domain/luaGlobalHook.js';
import { luaGlobalHookName } from '../../domain/luaGlobalHook.js';

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
 * @typeParam THost - Your engine context; must match the `THost` used in {@link defineHostSurfaceFor} (or {@link defineHostSurface}).
 * @typeParam THooks - When the surface was built with workflow hooks, pass the same `THooks` so {@link HostScriptSession.invokeGlobalHookIfPresent} narrows to those payloads (match `surface`’s `workflowHooks` typing).
 */
export type HostScriptSessionOptions<
  THost,
  THooks extends HostWorkflowHooksSpec | undefined = undefined,
> = {
  /** Shared runtime (typically one Wasmoon VM for many slots). */
  readonly runtime: MicroverseRuntime;
  /** Surface produced by {@link defineHostSurface}. */
  readonly surface: HostSurface<THooks>;
  /** Host services passed into bridge handlers (orders, clock, …). */
  readonly host: THost;
  /** Stable sandbox id for this script / workflow / entity. */
  readonly slotKey: MicroverseId;
  /** Exact capability ids this session may invoke on any bridge method. */
  readonly allowedCapabilities: readonly CapabilityId[];
  /** Optional default timeout forwarded to {@link MicroverseSlot.run}. */
  readonly defaultTimeout?: TimeoutPolicy | undefined;
};

/**
 * Binds one **Lua slot** to a {@link HostSurface}: capability allowlist, Zod validation, and `mergeEnv` wiring.
 *
 * @remarks
 * - **Lua → host (bridges):** tables/methods from {@link defineHostSurface} on `_ENV` call into TypeScript with Zod validation.
 * - **Host → Lua (hooks):** when the surface defines `workflowHooks`, {@link HostScriptSession.openSession} installs
 *   a small `workflow` helper (`workflow:extend()` → handler table + slot registration) and
 *   {@link HostScriptSession.invokeGlobalHookIfPresent} dispatches `on…` methods on that table. Each session has its own
 *   slot env, so many workflows run concurrently without sharing Lua globals. Without `workflowHooks`, hooks are optional
 *   globals (`onSmoke`, …) invoked as plain functions.
 * - Call {@link HostScriptSession.openSession} once before running chunks or invocations; {@link HostScriptSession.dispose} when the slot is torn down.
 *
 * @typeParam THost - Same host type as your surface handlers.
 * @typeParam THooks - Align with {@link HostSurface} `workflowHooks` on the surface you pass in (or `undefined` when the surface has no workflow hooks).
 */
export class HostScriptSession<
  THost,
  THooks extends HostWorkflowHooksSpec | undefined = undefined,
> {
  private sandbox: MicroverseSlot | undefined;

  private readonly registry: InMemoryCapabilityRegistry;

  constructor(private readonly opts: HostScriptSessionOptions<THost, THooks>) {
    this.registry = new InMemoryCapabilityRegistry(createAllowlist([...opts.allowedCapabilities]));
  }

  /**
   * Allocates the underlying {@link MicroverseSlot} for this `slotKey` on the shared runtime.
   */
  readonly openSession = async (): Promise<void> => {
    this.sandbox = await this.opts.runtime.createMicroverse({ slotKey: this.opts.slotKey });
    const hooks = readWorkflowHooks(this.opts.surface);
    if (hooks !== undefined) {
      const prelude = buildWorkflowStubPreludeLua(hooks);
      const sb = this.requireMicroverseSlot();
      await sb.run({
        script: createMicroverseScript(prelude),
        mergeEnv: this.mergeEnv(),
        timeout: this.opts.defaultTimeout,
      });
    }
  };

  /**
   * Exposes the in-memory registry (e.g. to mutate allowlists in advanced tests).
   */
  readonly getCapabilityRegistry = (): InMemoryCapabilityRegistry => this.registry;

  private requireMicroverseSlot(): MicroverseSlot {
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
    const sb = this.requireMicroverseSlot();
    return sb.run({
      script: createMicroverseScript(source),
      mergeEnv: this.mergeEnv(),
      timeout: this.opts.defaultTimeout,
    });
  };

  /**
   * Host → Lua: when the surface has `workflowHooks`, invokes `impl:onHook(evt)` on the handler table registered by
   * `workflow:extend()` in this slot. Otherwise invokes `_ENV[globalName](evt)` when that entry is a function.
   *
   * @param globalName - Hook method name, e.g. `onOrderPlaced` (same as {@link luaGlobalHookName}).
   * @param payload - Table fields: only string, finite number, or boolean (Lua literals).
   */
  readonly invokeGlobalHookIfPresent = (async (
    globalName: string,
    payload: Readonly<Record<string, string | number | boolean>>,
  ) => {
    assertSafeLuaGlobalName(globalName);
    const sb = this.requireMicroverseSlot();
    const tbl = luaTableLiteralFromPlainRecord(payload);
    const hooks = readWorkflowHooks(this.opts.surface);
    const src =
      hooks !== undefined
        ? buildWorkflowHookInvokeLuaSource(globalName, tbl)
        : buildGlobalHookInvokeLuaSource(globalName, tbl);
    return sb.run({
      script: createMicroverseScript(src),
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
    const sb = this.requireMicroverseSlot();
    const tbl = luaTableLiteralFromUnknownRecord(payload);
    const src = [
      `local t = _ENV[${JSON.stringify(tableName)}]`,
      `local f = type(t) == "table" and t[${JSON.stringify(methodName)}] or nil`,
      `if type(f) == "function" then`,
      `  f(${tbl})`,
      `end`,
    ].join('\n');
    return sb.run({
      script: createMicroverseScript(src),
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

function readWorkflowHooks(surface: HostSurface<HostWorkflowHooksSpec | undefined>): HostWorkflowHooksSpec | undefined {
  if (!('workflowHooks' in surface)) {
    return undefined;
  }
  const wh = (surface as HostSurface<HostWorkflowHooksSpec>).workflowHooks;
  return wh;
}

function buildWorkflowStubPreludeLua(hooks: HostWorkflowHooksSpec): string {
  const hookNames = Object.keys(hooks)
    .sort((a, b) => a.localeCompare(b))
    .map((kind) => {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(kind)) {
        throw new Error(`unsafe workflow hook kind: ${kind}`);
      }
      return JSON.stringify(luaGlobalHookName(kind));
    });
  const lines: string[] = [
    'local Base = {}',
    'for _, name in ipairs({',
    ...hookNames.map((h) => `  ${h},`),
    '}) do',
    '  rawset(Base, name, function() end)',
    'end',
    'rawset(_ENV, "workflow", {',
    '  extend = function(_)',
    '    local w = setmetatable({}, { __index = Base })',
    '    rawset(_ENV, "__microverse_lua_WorkflowImpl", w)',
    '    return w',
    '  end,',
    '})',
  ];
  return lines.join('\n');
}

function buildWorkflowHookInvokeLuaSource(methodName: string, evtLiteral: string): string {
  return [
    `local impl = rawget(_ENV, "__microverse_lua_WorkflowImpl")`,
    `if type(impl) == "table" then`,
    `  local m = rawget(impl, ${JSON.stringify(methodName)})`,
    `  if type(m) == "function" then`,
    `    m(impl, ${evtLiteral})`,
    `  end`,
    `end`,
  ].join('\n');
}

function buildGlobalHookInvokeLuaSource(globalName: string, evtLiteral: string): string {
  return [
    `local f = rawget(_ENV, ${JSON.stringify(globalName)})`,
    `if type(f) == "function" then`,
    `  f(${evtLiteral})`,
    `end`,
  ].join('\n');
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
