import type {
  LuarizerDefManifest,
  ManifestClass,
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
 * Erased method entry stored inside a {@link HostSurfaceSpec}. Produced by {@link fn}.
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
export type HostSurfaceSpec = Readonly<Record<string, Readonly<Record<string, AnyHostSurfaceMethod>>>>;

/**
 * Compiled host surface: bridge factories for `mergeEnv` plus manifest builder for `.d.lua` generation.
 */
export type HostSurface = {
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
   */
  readonly toLuarizerDefManifest: (opts: {
    readonly output: string;
    readonly headerNote?: string | undefined;
  }) => LuarizerDefManifest;
};

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
export function fn<THost, TIn, TOut>(def: HostSurfaceMethodEntry<THost, TIn, TOut>): AnyHostSurfaceMethod {
  return def as unknown as AnyHostSurfaceMethod;
}

/**
 * Declares a **host surface**: nested bridge tables for Lua, each method gated by a capability and Zod schemas.
 *
 * @remarks
 * - Each top-level key becomes one bridge name injected via `mergeEnv` (e.g. `orders`, `time`).
 * - Lua calls look like `orders.get({ orderId = "x" })` — one payload table per method.
 * - Pair with {@link HostScriptSession} or {@link buildBridgeMergeEnvForHost} and an allowlisted registry.
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
export function defineHostSurface<const TSpec extends HostSurfaceSpec>(spec: TSpec): HostSurface {
  return {
    toBridgeDeclarations: () => toBridgeDeclarationsFromSpec(spec),
    toLuarizerDefManifest: (opts) => manifestFromSpec(spec, opts),
  };
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
          api[methodName] = (payload: unknown) => {
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

function manifestFromSpec<TSpec extends HostSurfaceSpec>(
  spec: TSpec,
  opts: { readonly output: string; readonly headerNote?: string | undefined },
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
  return {
    schemaVersion: 1,
    output: opts.output,
    headerNote: opts.headerNote,
    classes,
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
 * @param surface - Result of {@link defineHostSurface}.
 */
export function buildBridgeMergeEnvForHost<THost>(
  host: THost & WithLuarizerCapabilityRegistry,
  slotKey: string,
  surface: HostSurface,
): Readonly<Record<string, unknown>> {
  return buildDeclarativeBridgeTable(host, slotKey, [...surface.toBridgeDeclarations()]);
}
