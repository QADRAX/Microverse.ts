import type { CapabilityId } from '@luarizer/runtime-capabilities';
import { createCapabilityId } from '@luarizer/runtime-capabilities';

import type { HostSurfaceMethodEntry } from './hostSurfaceTypes.js';

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
