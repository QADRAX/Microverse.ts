import type { CapabilityRegistryPort } from '@microverse/runtime-capabilities';

/**
 * Well-known symbol key used to attach a {@link CapabilityRegistryPort} on the host object
 * while surface bridge methods run. Populated by {@link augmentHostWithCapabilityRegistry} or
 * internally by {@link HostScriptSession}.
 */
export const MICROVERSE_CAPABILITY_REGISTRY = Symbol.for('microverse:capabilityRegistry');

/**
 * Host object extended with the capability registry required by host-surface bridge wrappers.
 */
export type WithMicroverseCapabilityRegistry = {
  readonly [MICROVERSE_CAPABILITY_REGISTRY]: CapabilityRegistryPort;
};
