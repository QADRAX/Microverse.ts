import type {
  LuarizerDefManifest,
  ManifestAlias,
  ManifestClass,
  ManifestLuaHook,
  ManifestMethod,
  ManifestParam,
} from '@luarizer/lua-defs';
import { buildDeclarativeBridgeTable, type DeclarativeBridgeDeclaration } from '@luarizer/runtime-bridge';
import type { CapabilityId } from '@luarizer/runtime-capabilities';
import { createCapabilityId } from '@luarizer/runtime-capabilities';
import { validateWithZodSchema } from '@luarizer/runtime-zod';
import { z } from 'zod';

import {
  LUARIZER_CAPABILITY_REGISTRY,
  type WithLuarizerCapabilityRegistry,
} from '../domain/capabilityRegistrySymbol.js';
import { isLuaTypeAtom } from './luaTypeAtoms.js';
import { luaGlobalHookName } from './luaGlobalHook.js';
import { zodToLuaTypeRef } from './zodToLuaTypeRef.js';

/**
 * Context passed to every surface `handler`: your typed host plus the active Lua **slot key** (string form).
 *
 * @typeParam THost - Host services / world object you declare for `fn` handlers.
 */
export type HostFnContext<THost> = {
  readonly host: THost;
  /** Stable slot identifier for this sandbox (same convention as `DeclarativeBridgeDeclaration`). */
  readonly slotKey: string;
};

/**
 * Strongly typed description of one bridge method. Pass this object to {@link fn} so TypeScript
 * checks `handler` against `input` / `output` schemas.
 *
 * @typeParam THost - Host type available as `ctx.host` inside `handler`.
 * @typeParam TIn - Payload type after Zod `input` parsing (Lua calls the bridge with one table argument).
 * @typeParam TOut - Return type validated by Zod `output` before crossing back to Lua.
 */
export type HostSurfaceMethodEntry<THost, TIn, TOut> = {
  /** Capability required to invoke this method; checked against the session registry before the handler runs. */
  readonly capability: CapabilityId;
  /** Zod schema for the single payload object from Lua (e.g. `z.object({ id: z.string() })`). */
  readonly input: z.ZodType<TIn>;
  /** Zod schema for the value returned to Lua. */
  readonly output: z.ZodType<TOut>;
  /** Synchronous host logic. Keep side effects on `ctx.host` services only. */
  readonly handler: (ctx: HostFnContext<THost>, input: TIn) => TOut;
  /** Optional description emitted into the LuaCATS manifest. */
  readonly description?: string | undefined;
  /**
   * Optional LuaCATS overrides for manifest emission when {@link zodToLuaTypeRef} is too generic.
   * `paramTypes` keys must match `input` object keys (or `value` for non-object inputs).
   */
  readonly lua?: {
    readonly paramTypes?: Partial<Record<string, string>> | undefined;
    readonly returns?: string | undefined;
  };
};

/**
 * Erased method entry stored inside a {@link HostSurfaceSpec}. Use {@link fn} for typed entries; assignability widens at the spec boundary.
 */
export type AnyHostSurfaceMethod = {
  readonly capability: CapabilityId;
  readonly input: z.ZodTypeAny;
  readonly output: z.ZodTypeAny;
  readonly handler: (ctx: HostFnContext<unknown>, input: unknown) => unknown;
  readonly description?: string | undefined;
  readonly lua?: {
    readonly paramTypes?: Partial<Record<string, string>> | undefined;
    readonly returns?: string | undefined;
  };
};

/**
 * Tree shape accepted by {@link defineHostSurface}: top-level keys become Lua global bridge **tables**
 * (e.g. `orders`, `billing`); inner keys become **methods** on that table.
 */
export type HostSurfaceSpec = Readonly<
  Record<string, Readonly<Record<string, AnyHostSurfaceMethod | HostSurfaceMethodEntry<any, any, any>>>>
>;

/**
 * Surface spec where every `fn<THost, …>(…)` entry must use the same host type as your engine context
 * (the `THost` you pass as `host` into {@link HostScriptSession}).
 */
export type HostSurfaceSpecForHost<THost> = Readonly<{
  readonly [bridge: string]: Readonly<{
    readonly [method: string]: HostSurfaceMethodEntry<THost, any, any>;
  }>;
}>;

/**
 * Zod object schemas keyed by PascalCase event kind (`OrderPlaced` → Lua global `onOrderPlaced`).
 * Passed as the second argument to {@link defineHostSurface} to emit workflow hook typings into `.d.lua`.
 */
export type HostWorkflowHooksSpec = Readonly<Record<string, z.ZodObject<any>>>;

/**
 * Bridge + manifest API shared by every {@link HostSurface} (with or without workflow hooks).
 */
export type HostSurfaceCore = {
  /**
   * Declarative bridge declarations compatible with {@link buildDeclarativeBridgeTable}.
   * The host must satisfy {@link WithLuarizerCapabilityRegistry} (see {@link HostScriptSession}).
   */
  readonly toBridgeDeclarations: () => ReadonlyArray<
    DeclarativeBridgeDeclaration<WithLuarizerCapabilityRegistry, string>
  >;
  /**
   * Builds a `LuarizerDefManifest` for `@luarizer/lua-defs` (`buildLuaCatsDocument`, `generateDefs`, CLI).
   *
   * @param opts.output - Default `.d.lua` output path recorded in the manifest.
   * @param opts.headerNote - Optional banner comment in the generated file.
   * @param opts.luaTypeAliases - Optional overrides / extra `---@alias` entries; by default aliases are inferred from Zod + `fn(..., lua)`.
   */
  readonly toLuarizerDefManifest: (opts: {
    readonly output: string;
    readonly headerNote?: string | undefined;
    /**
     * Optional extra `---@alias` entries, or overrides for inferred aliases (same key replaces inferred).
     */
    readonly luaTypeAliases?: Readonly<Record<string, string>> | undefined;
  }) => LuarizerDefManifest;
};

/**
 * Compiled host surface: bridge factories for `mergeEnv` plus manifest builder for `.d.lua` generation.
 *
 * @typeParam THooks - When you pass `workflowHooks` to {@link defineHostSurface}, the returned surface includes
 * `workflowHooks` so callers can type workflow events from the surface object alone.
 */
export type HostSurface<THooks extends HostWorkflowHooksSpec | undefined = undefined> = [undefined] extends [THooks]
  ? HostSurfaceCore
  : HostSurfaceCore & { readonly workflowHooks: THooks };

/** Options passed to {@link HostSurfaceCore.toLuarizerDefManifest}. */
export type LuarizerDefManifestGeneratorOpts = Parameters<HostSurfaceCore['toLuarizerDefManifest']>[0];

/**
 * Creates a {@link CapabilityId} from a namespaced string. Must contain a colon (`domain:action`),
 * matching {@link createCapabilityId} rules.
 *
 * @param id - Branded capability string, e.g. `` `orders:read` ``.
 */
export function cap(id: `${string}:${string}`): CapabilityId {
  return createCapabilityId(id);
}

/**
 * Wraps a typed {@link HostSurfaceMethodEntry} so it can live inside a {@link HostSurfaceSpec} object literal.
 * Preserves inference for `THost`, `TIn`, and `TOut` at the call site.
 */
export function fn<THost, TIn, TOut>(def: HostSurfaceMethodEntry<THost, TIn, TOut>): HostSurfaceMethodEntry<THost, TIn, TOut> {
  return def;
}

/**
 * Declares a **host surface**: nested bridge tables for Lua, each method gated by a capability and Zod schemas.
 *
 * @remarks
 * - Each top-level key becomes one bridge name injected via `mergeEnv` (e.g. `orders`, `time`).
 * - Lua calls look like `orders:get({ orderId = "x" })` (or `orders.get({ ... })`) — one payload table per method;
 *   bridges accept both forms (colon passes `self` as the first argument).
 * - Pair with {@link HostScriptSession} or {@link buildBridgeMergeEnvForHost} and an allowlisted registry.
 * - Optional **workflow hooks** (second argument): Zod payloads for `onOrderPlaced`, … — emitted into LuaCATS so `lua/workflows` stay typed; the returned surface includes them as readonly `workflowHooks` on the surface object.
 *
 * @example
 * ```ts
 * const surface = defineHostSurface({
 *   time: {
 *     delta: fn<MyHost, Record<string, never>, number>({
 *       capability: cap('engine:time'),
 *       input: z.object({}),
 *       output: z.number(),
 *       handler: ({ host }) => host.clock.dt,
 *     }),
 *   },
 * });
 * ```
 */
export function defineHostSurface<const TSpec extends HostSurfaceSpec>(spec: TSpec): HostSurface<undefined>;
export function defineHostSurface<
  const TSpec extends HostSurfaceSpec,
  const THooks extends HostWorkflowHooksSpec,
>(spec: TSpec, workflowHooks: THooks): HostSurface<THooks>;
export function defineHostSurface<const TSpec extends HostSurfaceSpec>(
  spec: TSpec,
  workflowHooks?: HostWorkflowHooksSpec,
): HostSurface<undefined> | HostSurface<HostWorkflowHooksSpec> {
  const core: HostSurfaceCore = {
    toBridgeDeclarations: () => toBridgeDeclarationsFromSpec(spec),
    toLuarizerDefManifest: (opts) => manifestFromSpec(spec, opts, workflowHooks),
  };
  if (workflowHooks === undefined) {
    return core as HostSurface<undefined>;
  }
  return { ...core, workflowHooks } as HostSurface<HostWorkflowHooksSpec>;
}

/**
 * Same as {@link defineHostSurface}, but requires every bridge method to be typed with the same `THost`
 * so `fn<THost, …>(…)` stays aligned with your engine object (for example `BusinessEngineHost`).
 *
 * @typeParam THooks - Inferred from `workflowHooks` when you pass it; omit (or leave defaulted) for a surface without workflow hooks.
 *
 * @remarks
 * Avoid `defineHostSurfaceFor<YourHost>(spec, hooks)` with a **single** explicit type argument: TypeScript will
 * fix `THooks` to its default (`undefined`) and reject the second value. Omit type arguments (host is inferred from
 * each `fn<YourHost, …>`), or pass both: `defineHostSurfaceFor<YourHost, typeof hooks>(spec, hooks)`.
 */
export function defineHostSurfaceFor<
  THost,
  const THooks extends HostWorkflowHooksSpec | undefined = undefined,
>(
  spec: HostSurfaceSpecForHost<THost>,
  workflowHooks?: THooks,
): THooks extends HostWorkflowHooksSpec ? HostSurface<THooks> : HostSurface<undefined> {
  return (
    workflowHooks === undefined
      ? defineHostSurface(spec as unknown as HostSurfaceSpec)
      : defineHostSurface(spec as unknown as HostSurfaceSpec, workflowHooks)
  ) as THooks extends HostWorkflowHooksSpec ? HostSurface<THooks> : HostSurface<undefined>;
}

function toBridgeDeclarationsFromSpec<TSpec extends HostSurfaceSpec>(
  spec: TSpec,
): ReadonlyArray<DeclarativeBridgeDeclaration<WithLuarizerCapabilityRegistry, string>> {
  const out: DeclarativeBridgeDeclaration<WithLuarizerCapabilityRegistry, string>[] = [];
  for (const bridgeName of Object.keys(spec)) {
    const methods = spec[bridgeName]!;
    out.push({
      name: bridgeName,
      perEntity: true,
      createApi: (host, slotKey) => {
        const api: Record<string, (payload: unknown) => unknown> = {};
        for (const methodName of Object.keys(methods)) {
          const entry = methods[methodName]!;
          api[methodName] = (...args: unknown[]) => {
            const payload = args.length >= 2 ? args[1] : args[0];
            const registry = host[LUARIZER_CAPABILITY_REGISTRY];
            if (!registry.isAllowed(entry.capability)) {
              throw new Error(`capability denied: ${String(entry.capability)}`);
            }
            const parsedIn = validateWithZodSchema(entry.input as z.ZodType<unknown>, payload);
            if (parsedIn._tag === 'err') {
              throw new Error(parsedIn.error);
            }
            const result = entry.handler({ host, slotKey: String(slotKey) }, parsedIn.value);
            const parsedOut = validateWithZodSchema(entry.output as z.ZodType<unknown>, result);
            if (parsedOut._tag === 'err') {
              throw new Error(parsedOut.error);
            }
            return parsedOut.value;
          };
        }
        return Object.freeze(api);
      },
    });
  }
  return out;
}

function nominalTokensFromLuaReturnString(retLua: string): readonly string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const segment of retLua.split('|')) {
    const s = segment.trim();
    if (!/^[A-Za-z_]\w*$/.test(s)) {
      continue;
    }
    if (isLuaTypeAtom(s)) {
      continue;
    }
    if (seen.has(s)) {
      continue;
    }
    seen.add(s);
    out.push(s);
  }
  return out;
}

function unwrapOutputBaseForAlias(schema: z.ZodTypeAny): z.ZodTypeAny {
  let cur: z.ZodTypeAny = schema;
  for (;;) {
    if (cur instanceof z.ZodOptional || cur instanceof z.ZodNullable) {
      cur = cur.unwrap();
      continue;
    }
    if (cur instanceof z.ZodDefault) {
      cur = cur.removeDefault();
      continue;
    }
    if (cur instanceof z.ZodReadonly) {
      cur = cur.unwrap();
      continue;
    }
    if (cur instanceof z.ZodEffects) {
      cur = cur.innerType();
      continue;
    }
    if (cur instanceof z.ZodPipeline) {
      cur = cur._def.out as z.ZodTypeAny;
      continue;
    }
    break;
  }
  return cur;
}

function inferLuaTypeAliasesFromHostSpec(spec: HostSurfaceSpec): readonly ManifestAlias[] {
  const byName = new Map<string, string>();

  for (const bridgeName of Object.keys(spec)) {
    const methods = spec[bridgeName]!;
    for (const methodName of Object.keys(methods)) {
      const entry = methods[methodName]!;

      const luaParams = entry.lua?.paramTypes;
      if (luaParams !== undefined) {
        const baseInput = unwrapInputSchema(entry.input);
        if (baseInput instanceof z.ZodObject) {
          const shape = baseInput.shape as Record<string, z.ZodTypeAny>;
          for (const key of Object.keys(luaParams)) {
            const L = luaParams[key as keyof typeof luaParams];
            if (L === undefined || typeof L !== 'string') {
              continue;
            }
            if (!/^[A-Za-z_]\w*$/.test(L) || isLuaTypeAtom(L)) {
              continue;
            }
            const field = shape[key];
            if (field === undefined) {
              continue;
            }
            const def = zodToLuaTypeRef(field);
            if (L !== def) {
              byName.set(L, def);
            }
          }
        }
      }

      const retLua = entry.lua?.returns;
      if (typeof retLua === 'string' && retLua.length > 0) {
        for (const T of nominalTokensFromLuaReturnString(retLua)) {
          const baseOut = unwrapOutputBaseForAlias(entry.output);
          const def = zodToLuaTypeRef(baseOut);
          if (T !== def) {
            byName.set(T, def);
          }
        }
      }
    }
  }

  return [...byName.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, definition]) => ({ name, definition }));
}

function manifestFromSpec<TSpec extends HostSurfaceSpec>(
  spec: TSpec,
  opts: {
    readonly output: string;
    readonly headerNote?: string | undefined;
    readonly luaTypeAliases?: Readonly<Record<string, string>> | undefined;
  },
  workflowHooks?: HostWorkflowHooksSpec,
): LuarizerDefManifest {
  const classes: ManifestClass[] = [];
  for (const bridgeName of Object.keys(spec)) {
    const methods = spec[bridgeName]!;
    const manifestMethods: ManifestMethod[] = [];
    for (const methodName of Object.keys(methods)) {
      const entry = methods[methodName]!;
      manifestMethods.push({
        name: methodName,
        description: entry.description,
        params: zodInputToManifestParams(entry.input, entry.lua?.paramTypes),
        returns: entry.lua?.returns ?? zodToLuaTypeRef(entry.output),
      });
    }
    classes.push({
      name: bridgeName,
      methods: manifestMethods,
    });
  }
  const inferred = inferLuaTypeAliasesFromHostSpec(spec);
  const merged = new Map<string, string>(inferred.map((a) => [a.name, a.definition]));
  if (opts.luaTypeAliases !== undefined) {
    for (const [k, v] of Object.entries(opts.luaTypeAliases)) {
      merged.set(k, v);
    }
  }
  const aliases = merged.size === 0 ? undefined : [...merged.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, definition]) => ({ name, definition }));

  const luaHooks: ManifestLuaHook[] | undefined =
    workflowHooks === undefined
      ? undefined
      : (Object.keys(workflowHooks) as string[])
          .sort((a, b) => a.localeCompare(b))
          .map((kind) => {
            const schema = workflowHooks[kind];
            if (!(schema instanceof z.ZodObject)) {
              throw new Error(`defineHostSurface workflowHooks: "${kind}" must be a z.object(...)`);
            }
            const hookName = luaGlobalHookName(kind);
            return {
              name: hookName,
              paramName: 'evt',
              payloadLuaType: zodToLuaTypeRef(schema),
              description: `Workflow hook for ${kind} events (invoked from host as ${hookName}).`,
            };
          });

  return {
    schemaVersion: 1,
    output: opts.output,
    headerNote: opts.headerNote,
    aliases,
    classes,
    luaHooks,
  };
}

function zodInputToManifestParams(
  input: z.ZodTypeAny,
  luaParamTypes: Partial<Record<string, string>> | undefined,
): ManifestParam[] | undefined {
  const base = unwrapInputSchema(input);
  if (base instanceof z.ZodObject) {
    const shape = base.shape as Record<string, z.ZodTypeAny>;
    return Object.keys(shape).map((name) => ({
      name,
      luaType: luaParamTypes?.[name] ?? zodToLuaTypeRef(shape[name]!),
    }));
  }
  return [{ name: 'value', luaType: luaParamTypes?.value ?? zodToLuaTypeRef(base) }];
}

function unwrapInputSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
  let cur: z.ZodTypeAny = schema;
  if (cur instanceof z.ZodEffects) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- ZodEffects.innerType()
    cur = cur.innerType();
  }
  if (cur instanceof z.ZodPipeline) {
    cur = cur._def.in as z.ZodTypeAny;
  }
  return cur;
}

/**
 * Builds a frozen `mergeEnv` table: bridge name → API object, ready for `Sandbox.run({ mergeEnv })`.
 *
 * @param host - Your host context, already extended with {@link LUARIZER_CAPABILITY_REGISTRY}.
 * @param slotKey - Same slot key passed to `buildDeclarativeBridgeTable` (string form of `SandboxId` is fine).
 * @param surface - Result of {@link defineHostSurface} (implements {@link HostSurfaceCore}).
 */
export function buildBridgeMergeEnvForHost<THost>(
  host: THost & WithLuarizerCapabilityRegistry,
  slotKey: string,
  surface: HostSurfaceCore,
): Readonly<Record<string, unknown>> {
  return buildDeclarativeBridgeTable(host, slotKey, [...surface.toBridgeDeclarations()]);
}
