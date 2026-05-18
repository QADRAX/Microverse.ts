import { describe, expect, it } from 'vitest';

import { createCapabilityId } from '../../domain/capabilities/CapabilityId';
import { createAllowlist } from '../../domain/capabilities/CapabilityPolicy';
import { InMemoryCapabilityRegistry } from '../../infrastructure/registry/InMemoryCapabilityRegistry';
import { evaluateCapability } from './evaluateCapability';

describe('evaluateCapability', () => {
  it('allows registered capabilities', async () => {
    const id = createCapabilityId('lua:eval');
    const registry = new InMemoryCapabilityRegistry(createAllowlist([id]));
    const result = await evaluateCapability([registry], id);
    expect(result._tag).toBe('ok');
  });

  it('denies unknown capabilities', async () => {
    const registry = new InMemoryCapabilityRegistry(createAllowlist([]));
    const result = await evaluateCapability([registry], createCapabilityId('lua:eval'));
    expect(result._tag).toBe('err');
  });
});
