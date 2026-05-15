import type { CapabilityRegistryPort } from '@luarizer/runtime-capabilities';

/**
 * Well-known symbol key used to attach a {@link CapabilityRegistryPort} on the host object
 * while surface bridge methods run. Populated by {@link augmentHostWithCapabilityRegistry} or
 * internally by {@link HostScriptSession}.
 */
export const LUARIZER_CAPABILITY_REGISTRY = Symbol.for('luarizer:capabilityRegistry');

/**
 * Host object extended with the capability registry required by host-surface bridge wrappers.
 */
export type WithLuarizerCapabilityRegistry = {
  readonly [LUARIZER_CAPABILITY_REGISTRY]: CapabilityRegistryPort;
};
