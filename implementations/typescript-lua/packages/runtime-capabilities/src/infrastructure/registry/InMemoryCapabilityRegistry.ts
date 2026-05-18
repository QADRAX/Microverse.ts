import type { CapabilityRegistryPort } from '../../application/ports/CapabilityRegistryPort';
import type { CapabilityId } from '../../domain/capabilities/CapabilityId';
import type { CapabilityPolicy } from '../../domain/capabilities/CapabilityPolicy';

export class InMemoryCapabilityRegistry implements CapabilityRegistryPort {
  constructor(private policy: CapabilityPolicy) {}

  readonly isAllowed = (id: CapabilityId): boolean => this.policy.allow.has(id);

  readonly setPolicy = (policy: CapabilityPolicy): void => {
    this.policy = policy;
  };
}
