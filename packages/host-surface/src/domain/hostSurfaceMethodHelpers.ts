import type { CapabilityId } from '@microverse/runtime-capabilities';
import { createCapabilityId } from '@microverse/runtime-capabilities';

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

function inferMethodAsync(def: {
  readonly handler: { constructor: { readonly name: string } };
  readonly async?: boolean | undefined;
}): boolean {
  if (def.async === true) {
    return true;
  }
  if (def.async === false) {
    return false;
  }
  return def.handler.constructor.name === 'AsyncFunction';
}

/**
 * Wraps a typed {@link HostSurfaceMethodEntry} so it can live inside a {@link HostSurfaceSpec} object literal.
 * Preserves inference for `THost`, `TIn`, and `TOut` at the call site. Sets {@link HostSurfaceMethodEntry.async}
 * when the handler is an `async function` (or when `async: true` is set explicitly).
 */
export function fn<THost, TIn, TOut>(def: HostSurfaceMethodEntry<THost, TIn, TOut>): HostSurfaceMethodEntry<THost, TIn, TOut> {
  return {
    ...def,
    async: inferMethodAsync(def),
  };
}
