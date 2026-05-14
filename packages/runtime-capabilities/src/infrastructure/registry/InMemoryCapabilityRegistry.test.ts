import { describe, expect, it } from 'vitest';

import { createCapabilityId } from '../../domain/capabilities/CapabilityId';
import { createAllowlist, mergePolicies } from '../../domain/capabilities/CapabilityPolicy';
import { InMemoryCapabilityRegistry } from './InMemoryCapabilityRegistry';

describe('InMemoryCapabilityRegistry', () => {
  it('honors allowlists', () => {
    const id = createCapabilityId('lua:eval');
    const registry = new InMemoryCapabilityRegistry(createAllowlist([id]));
    expect(registry.isAllowed(id)).toBe(true);
    expect(registry.isAllowed(createCapabilityId('fs:read'))).toBe(false);
  });
});

describe('mergePolicies', () => {
  it('unions allowlists', () => {
    const a = createAllowlist([createCapabilityId('a:b')]);
    const b = createAllowlist([createCapabilityId('c:d')]);
    const merged = mergePolicies(a, b);
    expect(merged.allow.size).toBe(2);
  });
});
