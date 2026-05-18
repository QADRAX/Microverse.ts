export type { CapabilityRegistryPort } from './application/ports/CapabilityRegistryPort';
export type { CapabilityDescriptor } from './domain/capabilities/CapabilityDescriptor';
export { createCapabilityId, type CapabilityId } from './domain/capabilities/CapabilityId';
export {
  createAllowlist,
  mergePolicies,
  type CapabilityPolicy,
} from './domain/capabilities/CapabilityPolicy';
export { InMemoryCapabilityRegistry } from './infrastructure/registry/InMemoryCapabilityRegistry';
