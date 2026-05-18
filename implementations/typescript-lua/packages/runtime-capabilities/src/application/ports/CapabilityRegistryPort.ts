import type { CapabilityId } from '../../domain/capabilities/CapabilityId';

export type CapabilityRegistryPort = {
  readonly isAllowed: (id: CapabilityId) => boolean;
};
