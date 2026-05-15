import type { CapabilityRegistryPort } from '@luarizer/runtime-capabilities';

import { LUARIZER_CAPABILITY_REGISTRY, type WithLuarizerCapabilityRegistry } from '../../domain/capabilityRegistrySymbol.js';

/**
 * Returns a shallow copy of `host` with {@link LUARIZER_CAPABILITY_REGISTRY} set to `registry`.
 * Bridge handlers read the registry to enforce per-session capability allowlists.
 *
 * @param host - Your engine / service context passed into `buildDeclarativeBridgeTable`.
 * @param registry - Typically an {@link InMemoryCapabilityRegistry} from `@luarizer/runtime-capabilities`.
 */
export function augmentHostWithCapabilityRegistry<THost>(
  host: THost,
  registry: CapabilityRegistryPort,
): THost & WithLuarizerCapabilityRegistry {
  return Object.assign(host as object, {
    [LUARIZER_CAPABILITY_REGISTRY]: registry,
  }) as THost & WithLuarizerCapabilityRegistry;
}
