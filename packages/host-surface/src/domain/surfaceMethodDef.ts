import { createCapabilityId, type CapabilityId } from '@microverse/runtime-capabilities';
import type { z } from 'zod';

import { inferMethodAsync } from './inferMethodAsync.js';
import type { HostFnContext, HostSurfaceMethodEntry } from './hostSurfaceTypes.js';

/**
 * Consumer-facing method definition for the fluent {@link SurfaceBuilder} API.
 * Use `requires: 'domain:action'` for the capability id.
 */
export type SurfaceMethodDef<
  THost,
  TIn,
  TOut,
  TCap extends `${string}:${string}` = `${string}:${string}`,
> = {
  /** Capability id required to invoke this method (`domain:action`). */
  readonly requires: TCap;
  readonly input: z.ZodType<TIn>;
  readonly output: z.ZodType<TOut>;
  readonly handler: (ctx: HostFnContext<THost>, input: TIn) => TOut | Promise<TOut>;
  readonly async?: boolean | undefined;
  readonly description?: string | undefined;
  readonly lua?: {
    readonly paramTypes?: Partial<Record<string, string>> | undefined;
    readonly returns?: string | undefined;
  };
};

/**
 * Converts a {@link SurfaceMethodDef} into a compiled {@link HostSurfaceMethodEntry}.
 */
export function normalizeMethodDef<
  THost,
  TIn,
  TOut,
  const TCap extends `${string}:${string}`,
>(
  def: SurfaceMethodDef<THost, TIn, TOut, TCap>,
): HostSurfaceMethodEntry<THost, TIn, TOut, CapabilityId & TCap> {
  const entry = {
    capability: createCapabilityId(def.requires) as CapabilityId & TCap,
    input: def.input,
    output: def.output,
    handler: def.handler,
    async: inferMethodAsync(def),
    ...(def.description !== undefined ? { description: def.description } : {}),
    ...(def.lua !== undefined ? { lua: def.lua } : {}),
  } satisfies HostSurfaceMethodEntry<THost, TIn, TOut, CapabilityId & TCap>;
  return entry;
}
