import type { LuaDefManifest } from '@microverse/lua-defs';
import type { DeclarativeBridgeDeclaration } from '@microverse/runtime-bridge';
import type { CapabilityId } from '@microverse/runtime-capabilities';
import type { z } from 'zod';

import type { SurfaceCapabilityString } from './surfaceCapabilities.js';
import type { WithMicroverseCapabilityRegistry } from './capabilityRegistrySymbol.js';

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
 * @typeParam TCap - Capability id for this method (preserved when using {@link cap} at the call site).
 */
export type HostSurfaceMethodEntry<
  THost,
  TIn,
  TOut,
  TCap extends CapabilityId = CapabilityId,
> = {
  /** Capability required to invoke this method; checked against the session registry before the handler runs. */
  readonly capability: TCap;
  /** Zod schema for the single payload object from Lua (e.g. `z.object({ id: z.string() })`). */
  readonly input: z.ZodType<TIn>;
  /** Zod schema for the value returned to Lua. */
  readonly output: z.ZodType<TOut>;
  /**
   * Host logic at the Lua↔JS boundary. May return `Promise<TOut>`; Lua must use `:await()` on the returned handle
   * or pass an `onComplete` callback as the second argument (see `MICROVERSE_LUA_SLOT_VM_BOOTSTRAP` in `@microverse/runtime-wasm`).
   */
  readonly handler: (ctx: HostFnContext<THost>, input: TIn) => TOut | Promise<TOut>;
  /**
   * When true, manifest and Lua runtime treat this method as async (`MethodHandle` + optional `onComplete`).
   * Set automatically by {@link fn} for `async function` handlers.
   */
  readonly async?: boolean | undefined;
  /** Optional description emitted into the LuaCATS manifest. */
  readonly description?: string | undefined;
  /**
   * Advanced escape hatch for manifest emission. Prefer registering Zod schemas with {@link luaType}
   * (see `bridgePayloads` in the business example) so `.d.lua` stays inferred from `input` / `output`.
   * Does not replace async bridge typing (`async` on {@link fn} emits handle + `onComplete`).
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
  readonly handler: (ctx: HostFnContext<any>, input: any) => unknown; // eslint-disable-line @typescript-eslint/no-explicit-any -- erased spec entry
  readonly async?: boolean | undefined;
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
/* eslint-disable @typescript-eslint/no-explicit-any -- spec tree uses erased method entries */
export type HostSurfaceSpec = Readonly<
  Record<string, Readonly<Record<string, AnyHostSurfaceMethod | HostSurfaceMethodEntry<any, any, any, any>>>>
>;
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Surface spec where every `fn<THost, …>(…)` entry must use the same host type as your engine context
 * (the `THost` you pass as `host` into {@link HostScriptSession}).
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- per-method host typing uses independent in/out */
export type HostSurfaceSpecForHost<THost> = Readonly<{
  readonly [bridge: string]: Readonly<{
    readonly [method: string]: HostSurfaceMethodEntry<THost, any, any, any>;
  }>;
}>;
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Zod object schemas keyed by PascalCase event kind (`OrderPlaced` → Lua method `onOrderPlaced` on the handler from `workflow:extend()`).
 * Passed as the second argument to {@link defineHostSurface} to emit workflow hook typings into `.d.lua`.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- workflow hook payloads use open Zod object shapes */
export type HostWorkflowHooksSpec = Readonly<Record<string, z.ZodObject<any>>>;
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Bridge + manifest API shared by every {@link HostSurface} (with or without workflow hooks).
 *
 * @typeParam TCapabilities - Union of capability ids declared on the surface spec (see {@link InferSurfaceCapabilities}).
 */
export type HostSurfaceCore<TCapabilities extends CapabilityId = CapabilityId> = {
  /**
   * Declarative bridge declarations compatible with {@link buildDeclarativeBridgeTable}.
   * The host must satisfy {@link WithMicroverseCapabilityRegistry} (see {@link HostScriptSession}).
   */
  readonly toBridgeDeclarations: () => ReadonlyArray<
    DeclarativeBridgeDeclaration<WithMicroverseCapabilityRegistry, string>
  >;
  /**
   * Builds a `LuaDefManifest` for `@microverse/lua-defs` (`buildLuaCatsDocument`, `generateDefs`, CLI).
   *
   * @param opts.output - Default `.d.lua` output path recorded in the manifest.
   * @param opts.headerNote - Optional banner comment in the generated file.
     * @param opts.luaTypeAliases - Optional overrides / extra `---@alias` entries; by default aliases come from {@link luaType} on Zod schemas used in the surface.
   */
  readonly toLuaDefManifest: (opts: {
    readonly output: string;
    readonly headerNote?: string | undefined;
    /**
     * Optional extra `---@alias` entries, or overrides for inferred aliases (same key replaces inferred).
     */
    readonly luaTypeAliases?: Readonly<Record<string, string>> | undefined;
  }) => LuaDefManifest;
  /** Every capability id referenced by a method on this surface (deduplicated). */
  readonly capabilities: readonly TCapabilities[];
  /**
   * Subset allowlist for a script session. Only capabilities declared on this surface are accepted.
   */
  pickCapabilities<const T extends readonly SurfaceCapabilityString<TCapabilities>[]>(
    ...capabilities: T
  ): ReadonlyArray<Extract<T[number], TCapabilities>>;
};

/**
 * Compiled host surface: bridge factories for `mergeEnv` plus manifest builder for `.d.lua` generation.
 *
 * @typeParam THooks - When you pass `workflowHooks` to {@link defineHostSurface}, the returned surface includes
 * `workflowHooks` so callers can type workflow events from the surface object alone.
 * @typeParam TCapabilities - Capability ids declared on the surface (for script allowlists).
 */
export type HostSurface<
  THooks extends HostWorkflowHooksSpec | undefined = undefined,
  TCapabilities extends CapabilityId = CapabilityId,
> = [undefined] extends [THooks]
  ? HostSurfaceCore<TCapabilities>
  : HostSurfaceCore<TCapabilities> & { readonly workflowHooks: THooks };

/** Options passed to {@link HostSurfaceCore.toLuaDefManifest}. */
export type LuaDefManifestGeneratorOpts = Parameters<HostSurfaceCore['toLuaDefManifest']>[0];
