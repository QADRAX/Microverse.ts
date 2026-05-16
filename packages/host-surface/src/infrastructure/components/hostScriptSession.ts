import {
  createAllowlist,
  type CapabilityId,
  InMemoryCapabilityRegistry,
} from '@microverse.ts/runtime-capabilities';
import type { Result } from '@microverse.ts/shared';
import type { z } from 'zod';
import {
  applyScriptPropertyChanges,
  assertValidScriptPropertyBag,
  cloneScriptPropertyBag,
  createMicroverseScript,
  diffScriptProperties,
  type ExecutionFailure,
  type MutableScriptPropertyBag,
  type RunScriptResult,
  type MicroverseSlot,
  type MicroverseId,
  type MicroverseRuntime,
  type ScriptAuditEvent,
  type ScriptInstanceContext,
  type ScriptPropertyBag,
  type ScriptPropertyValue,
  type TimeoutPolicy,
} from '@microverse.ts/runtime-core';

import { MICROVERSE_LUA_COMPONENT_SLOT_PRELUDE } from '../../domain/componentSlotPrelude.js';
import {
  plainToScriptPropertyValue,
  scriptPropertyBagToMergeEnv,
} from '../../domain/scriptPropertyMergeEnv.js';
import { augmentHostWithCapabilityRegistry } from '../adapters/augmentHostWithCapabilityRegistry.js';
import { augmentHostWithScriptContext } from '../adapters/augmentHostWithScriptContext.js';
import { bridgeNamesFromSurface, buildBridgeMergeEnvForHost } from '../builders/bridgeMergeEnv.js';
import type { HostSurface, HostComponentHooksSpec } from '../../domain/hostSurfaceTypes.js';
import type { LuaGlobalHookName } from '../../domain/luaGlobalHook.js';
import { luaGlobalHookName } from '../../domain/luaGlobalHook.js';

export type ComponentEventHookInvokeArgs<TH extends HostComponentHooksSpec> = {
  [K in keyof TH & string]: readonly [hook: LuaGlobalHookName<K>, payload: Readonly<z.infer<TH[K]>>];
}[keyof TH & string];

type InvokeComponentEventHookFn<THooks extends HostComponentHooksSpec | undefined> = THooks extends HostComponentHooksSpec
  ? (...args: ComponentEventHookInvokeArgs<THooks>) => Promise<Result<RunScriptResult, ExecutionFailure>>
  : (
      hookName: string,
      payload: Readonly<Record<string, string | number | boolean>>,
    ) => Promise<Result<RunScriptResult, ExecutionFailure>>;

export type HostScriptSessionOptions<
  THost,
  THooks extends HostComponentHooksSpec | undefined = undefined,
> = {
  readonly runtime: MicroverseRuntime;
  readonly surface: HostSurface<THooks>;
  readonly host: THost;
  readonly slotKey: MicroverseId;
  readonly allowedCapabilities: readonly CapabilityId[];
  readonly defaultTimeout?: TimeoutPolicy | undefined;
  readonly script: ScriptInstanceContext;
  readonly enableComponentRuntime?: boolean | undefined;
  readonly propsSchema?: z.ZodObject<z.ZodRawShape> | undefined;
  readonly onScriptAudit?: ((event: ScriptAuditEvent) => void) | undefined;
};

export class HostScriptSession<
  THost,
  THooks extends HostComponentHooksSpec | undefined = undefined,
> {
  private sandbox: MicroverseSlot | undefined;

  private readonly hostProps: MutableScriptPropertyBag = {};

  private readonly registry: InMemoryCapabilityRegistry;

  readonly context: ScriptInstanceContext;

  constructor(private readonly opts: HostScriptSessionOptions<THost, THooks>) {
    this.registry = new InMemoryCapabilityRegistry(createAllowlist([...opts.allowedCapabilities]));
    this.context = opts.script;
  }

  readonly openSession = async (): Promise<void> => {
    this.sandbox = await this.opts.runtime.createMicroverse({ slotKey: this.opts.slotKey });
    const sb = this.requireMicroverseSlot();
    if (this.opts.enableComponentRuntime !== false) {
      await sb.run({
        script: createMicroverseScript(MICROVERSE_LUA_COMPONENT_SLOT_PRELUDE),
        mergeEnv: this.mergeEnv(),
        timeout: this.opts.defaultTimeout,
      });
      await sb.run({
        script: createMicroverseScript(buildBridgeNamesPreludeLua(bridgeNamesFromSurface(this.opts.surface))),
        mergeEnv: this.mergeEnv(),
        timeout: this.opts.defaultTimeout,
      });
      const hooks = readComponentHooks(this.opts.surface);
      if (hooks !== undefined) {
        const prelude = buildComponentEventStubPreludeLua(hooks);
        await sb.run({
          script: createMicroverseScript(prelude),
          mergeEnv: this.mergeEnv(),
          timeout: this.opts.defaultTimeout,
        });
      }
    }
  };

  readonly getCapabilityRegistry = (): InMemoryCapabilityRegistry => this.registry;

  private requireMicroverseSlot(): MicroverseSlot {
    if (this.sandbox === undefined) {
      throw new Error('HostScriptSession: openSession() was not called');
    }
    return this.sandbox;
  }

  private mergeEnv() {
    const withCaps = augmentHostWithCapabilityRegistry(this.opts.host, this.registry);
    const host = augmentHostWithScriptContext(withCaps, this.opts.script);
    return buildBridgeMergeEnvForHost(host, String(this.opts.slotKey), this.opts.surface);
  }

  private emitAudit(event: ScriptAuditEvent): void {
    this.opts.onScriptAudit?.(event);
  }

  private validatePropsBag(bag: ScriptPropertyBag): ScriptPropertyBag {
    if (this.opts.propsSchema !== undefined) {
      const parsed = this.opts.propsSchema.parse(bag);
      assertValidScriptPropertyBag(parsed);
      return parsed;
    }
    assertValidScriptPropertyBag(bag);
    return bag;
  }

  readonly getProps = (): Readonly<ScriptPropertyBag> => ({ ...this.hostProps });

  readonly setProps = async (bag: ScriptPropertyBag): Promise<void> => {
    const next = this.validatePropsBag(bag);
    const changed = diffScriptProperties(this.hostProps, next);
    applyScriptPropertyChanges(this.hostProps, next, changed);
    const sb = this.requireMicroverseSlot();
    await sb.run({
      script: createMicroverseScript(
        'local f = rawget(_ENV, "__microverse_lua_component_apply_incoming")\nif type(f) == "function" then f() end',
      ),
      mergeEnv: {
        ...this.mergeEnv(),
        __microverseIncomingProps: scriptPropertyBagToMergeEnv(this.hostProps),
      },
      timeout: this.opts.defaultTimeout,
    });
    if (changed.length > 0) {
      this.emitAudit({ kind: 'propsPatched', context: this.opts.script, changedKeys: changed });
      for (const key of changed) {
        const value = next[key];
        if (value !== undefined) {
          await this.invokeComponentHook('onPropsChanged', key, value);
        }
      }
    }
  };

  readonly patchProps = async (partial: ScriptPropertyBag): Promise<void> => {
    await this.setProps({ ...this.hostProps, ...partial });
  };

  readonly flushDirtyProps = async (): Promise<ScriptPropertyBag | null> => {
    if (this.opts.enableComponentRuntime === false) {
      return null;
    }
    const collected: Record<string, ScriptPropertyValue> = {};
    const sb = this.requireMicroverseSlot();
    await sb.run({
      script: createMicroverseScript(
        'local f = rawget(_ENV, "__microverse_lua_component_flush_to_sink")\nif type(f) == "function" then f() end',
      ),
      mergeEnv: {
        ...this.mergeEnv(),
        __microverseFlushPush: (key: string, value: unknown) => {
          const converted = plainToScriptPropertyValue(value);
          if (converted !== undefined) {
            collected[key] = converted;
          }
        },
      },
      timeout: this.opts.defaultTimeout,
    });
    const keys = Object.keys(collected);
    if (keys.length === 0) {
      return null;
    }
    const dirty = collected;
    for (const key of keys) {
      this.hostProps[key] = dirty[key]!;
    }
    this.emitAudit({ kind: 'propsFlushed', context: this.opts.script, dirtyKeys: keys });
    return dirty;
  };

  readonly runChunk = async (source: string) => {
    const sb = this.requireMicroverseSlot();
    return sb.run({
      script: createMicroverseScript(source),
      mergeEnv: this.mergeEnv(),
      timeout: this.opts.defaultTimeout,
    });
  };

  readonly invokeComponentHook = async (
    hookName: string,
    ...args: (string | ScriptPropertyValue | Readonly<Record<string, string | number | boolean>>)[]
  ): Promise<Result<RunScriptResult, ExecutionFailure>> => {
    assertSafeLuaGlobalName(hookName);
    this.emitAudit({ kind: 'hookInvoked', context: this.opts.script, hookName });
    const sb = this.requireMicroverseSlot();
    const argLiterals = args.map((a) => {
      if (typeof a === 'object' && a !== null && !Array.isArray(a)) {
        return luaTableLiteralFromPlainRecord(a as Readonly<Record<string, string | number | boolean>>);
      }
      return luaValueLiteral(a as string | ScriptPropertyValue);
    }).join(', ');
    const src = [
      `local impl = rawget(_ENV, "__microverse_lua_ComponentImpl")`,
      `if type(impl) == "table" then`,
      `  local attach = rawget(_ENV, "__microverse_lua_attach_bridges")`,
      `  if type(attach) == "function" then attach(impl) end`,
      `  local m = rawget(impl, ${JSON.stringify(hookName)})`,
      `  if type(m) == "function" then`,
      argLiterals.length > 0 ? `    m(impl, ${argLiterals})` : `    m(impl)`,
      `  end`,
      `end`,
    ].join('\n');
    return sb.run({
      script: createMicroverseScript(src),
      mergeEnv: this.mergeEnv(),
      timeout: this.opts.defaultTimeout,
    });
  };

  readonly invokeComponentEventHook = (async (
    hookName: string,
    payload: Readonly<Record<string, string | number | boolean>>,
  ) => {
    assertSafeLuaGlobalName(hookName);
    return this.invokeComponentHook(hookName, payload);
  }) as InvokeComponentEventHookFn<THooks>;

  readonly call = async (tableName: string, methodName: string, payload: Record<string, unknown>) => {
    const sb = this.requireMicroverseSlot();
    const tbl = luaTableLiteralFromUnknownRecord(payload);
    const src = [
      `local impl = rawget(_ENV, "__microverse_lua_ComponentImpl")`,
      `local bridges = type(impl) == "table" and impl.bridges or nil`,
      `local t = type(bridges) == "table" and bridges[${JSON.stringify(tableName)}] or nil`,
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

  readonly dispose = async (): Promise<void> => {
    if (this.sandbox !== undefined) {
      if (this.opts.enableComponentRuntime !== false) {
        await this.invokeComponentHook('onDestroy');
      }
      await this.sandbox.dispose();
      this.sandbox = undefined;
    }
  };

  /** Seeds host props bag without Lua sync (call before setProps after mount). */
  readonly seedHostProps = (bag: ScriptPropertyBag): void => {
    const cloned = cloneScriptPropertyBag(bag);
    for (const k of Object.keys(this.hostProps)) {
      delete this.hostProps[k];
    }
    Object.assign(this.hostProps, cloned);
  };
}

function assertSafeLuaGlobalName(name: string): void {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`unsafe Lua global name: ${name}`);
  }
}

function readComponentHooks(
  surface: HostSurface<HostComponentHooksSpec | undefined>,
): HostComponentHooksSpec | undefined {
  if (!('componentHooks' in surface)) {
    return undefined;
  }
  return (surface as HostSurface<HostComponentHooksSpec>).componentHooks;
}

function buildBridgeNamesPreludeLua(bridgeNames: readonly string[]): string {
  const entries = bridgeNames.map((n) => JSON.stringify(n)).join(', ');
  return `rawset(_ENV, "__microverse_bridge_names", { ${entries} })`;
}

function buildComponentEventStubPreludeLua(hooks: HostComponentHooksSpec): string {
  const hookNames = Object.keys(hooks)
    .sort((a, b) => a.localeCompare(b))
    .map((kind) => {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(kind)) {
        throw new Error(`unsafe component hook kind: ${kind}`);
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
    'rawset(_ENV, "__microverse_component_hook_base", Base)',
  ];
  return lines.join('\n');
}

function luaValueLiteral(value: string | ScriptPropertyValue): string {
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (value === null) {
    return 'nil';
  }
  if (Array.isArray(value)) {
    const items = value as readonly ScriptPropertyValue[];
    const luaItems = items.map((v) => luaValueLiteral(v)).join(', ');
    return `{ ${luaItems} }`;
  }
  const record = value as { readonly [key: string]: ScriptPropertyValue };
  const parts: string[] = [];
  for (const k of Object.keys(record)) {
    parts.push(`${k} = ${luaValueLiteral(record[k]!)}`);
  }
  return `{ ${parts.join(', ')} }`;
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
