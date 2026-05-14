import type { CapabilityRegistryPort } from '@luarizer/runtime-capabilities';

/**
 * Well-known symbol key used to attach a {@link CapabilityRegistryPort} on the host object
 * while surface bridge methods run. Populated by {@link augmentHostWithCapabilityRegistry} or
 * internally by {@link HostScriptSession}.
 */
export const LUARIZER_CAPABILITY_REGISTRY = Symbol.for('luarizer:capabilityRegistry');

/**
 * Host object extended with the capability registry required by {@link defineHostSurface} bridge wrappers.
 */
export type WithLuarizerCapabilityRegistry = {
  readonly [LUARIZER_CAPABILITY_REGISTRY]: CapabilityRegistryPort;
};

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
