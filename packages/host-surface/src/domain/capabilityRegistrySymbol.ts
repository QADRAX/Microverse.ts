import type { CapabilityRegistryPort } from '@luarizer/runtime-capabilities';

/** Attached to the host object while executing surface bridge methods. */
export const LUARIZER_CAPABILITY_REGISTRY = Symbol.for('luarizer:capabilityRegistry');

export type WithLuarizerCapabilityRegistry = {
  readonly [LUARIZER_CAPABILITY_REGISTRY]: CapabilityRegistryPort;
};

export function augmentHostWithCapabilityRegistry<THost>(
  host: THost,
  registry: CapabilityRegistryPort,
): THost & WithLuarizerCapabilityRegistry {
  return Object.assign(host as object, {
    [LUARIZER_CAPABILITY_REGISTRY]: registry,
  }) as THost & WithLuarizerCapabilityRegistry;
}
