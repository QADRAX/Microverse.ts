import type { ScriptInstanceContext } from '@microverse.ts/runtime-core';
import type { CapabilityId } from '@microverse.ts/runtime-capabilities';
import type { z } from 'zod';

/**
 * Context passed to every surface `handler`: your typed host plus the active Lua **slot key** (string form).
 *
 * @typeParam THost - Host services / world object you declare for bridge handlers.
 */
export type HostFnContext<THost> = {
  readonly host: THost;
  /** Stable slot identifier for this sandbox (same convention as `DeclarativeBridgeDeclaration`). */
  readonly slotKey: string;
  /** Mounted script instance identity (audit, logging). */
  readonly script: ScriptInstanceContext;
};

/**
 * Strongly typed description of one bridge method (produced by the fluent `.method(…)` builder).
 * TypeScript checks `handler` against `input` / `output` schemas.
 *
 * @typeParam THost - Host type available as `ctx.host` inside `handler`.
 * @typeParam TIn - Payload type after Zod `input` parsing (Lua calls the bridge with one table argument).
 * @typeParam TOut - Return type validated by Zod `output` before crossing back to Lua.
 * @typeParam TCap - Capability id for this method (from fluent `requires: 'domain:action'`).
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
   * or pass an `onComplete` callback as the second argument (see `MICROVERSE_LUA_SLOT_VM_BOOTSTRAP` in `@microverse.ts/runtime-wasm`).
   */
  readonly handler: (ctx: HostFnContext<THost>, input: TIn) => TOut | Promise<TOut>;
  /**
   * When true, manifest and Lua runtime treat this method as async (`MethodHandle` + optional `onComplete`).
   * Set automatically for `async function` handlers in the fluent builder.
   */
  readonly async?: boolean | undefined;
  /** Optional description emitted into the LuaCATS manifest. */
  readonly description?: string | undefined;
  /**
   * Advanced escape hatch for manifest emission. Prefer registering Zod schemas with {@link luaType}
   * (see `bridgePayloads` in the business example) so `.d.lua` stays inferred from `input` / `output`.
   * Does not replace async bridge typing (`async: true` emits handle + `onComplete` in `.d.lua`).
   * `paramTypes` keys must match `input` object keys (or `value` for non-object inputs).
   */
  readonly lua?: {
    readonly paramTypes?: Partial<Record<string, string>> | undefined;
    readonly returns?: string | undefined;
  };
};

/**
 * Erased method entry stored inside a {@link HostSurfaceSpec}. Assignability widens at the spec boundary.
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
 * Surface spec where every method entry uses the same host type as your engine context
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
 * Zod object schemas keyed by PascalCase event kind (`OrderPlaced` → Lua method `onOrderPlaced` on the component from `component:extend()`).
 * Passed to {@link SurfaceBuilder.componentHooks} to emit domain event typings into `.d.lua`.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- component hook payloads use open Zod object shapes */
export type HostComponentHooksSpec = Readonly<Record<string, z.ZodObject<any>>>;
/* eslint-enable @typescript-eslint/no-explicit-any */
