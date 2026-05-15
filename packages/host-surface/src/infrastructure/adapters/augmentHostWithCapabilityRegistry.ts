import type { CapabilityRegistryPort } from '@microverse/runtime-capabilities';

import { MICROVERSE_CAPABILITY_REGISTRY, type WithMicroverseCapabilityRegistry } from '../../domain/capabilityRegistrySymbol.js';

/**
 * Returns a shallow copy of `host` with {@link MICROVERSE_CAPABILITY_REGISTRY} set to `registry`.
 * Bridge handlers read the registry to enforce per-session capability allowlists.
 *
 * @param host - Your engine / service context passed into `buildDeclarativeBridgeTable`.
 * @param registry - Typically an {@link InMemoryCapabilityRegistry} from `@microverse/runtime-capabilities`.
 */
export function augmentHostWithCapabilityRegistry<THost>(
  host: THost,
  registry: CapabilityRegistryPort,
): THost & WithMicroverseCapabilityRegistry {
  return Object.assign(host as object, {
    [MICROVERSE_CAPABILITY_REGISTRY]: registry,
  }) as THost & WithMicroverseCapabilityRegistry;
}
