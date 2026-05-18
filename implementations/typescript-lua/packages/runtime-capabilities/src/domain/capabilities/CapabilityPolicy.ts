import type { CapabilityId } from './CapabilityId';

export type CapabilityPolicy = {
  readonly allow: ReadonlySet<CapabilityId>;
};

export function createAllowlist(capabilities: readonly CapabilityId[]): CapabilityPolicy {
  return { allow: new Set(capabilities) };
}

export function mergePolicies(a: CapabilityPolicy, b: CapabilityPolicy): CapabilityPolicy {
  const merged = new Set<CapabilityId>([...a.allow, ...b.allow]);
  return { allow: merged };
}
