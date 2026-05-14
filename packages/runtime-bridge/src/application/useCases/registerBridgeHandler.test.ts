import { describe, expect, it } from 'vitest';

import {
  createAllowlist,
  createCapabilityId,
  InMemoryCapabilityRegistry,
} from '@luarizer/runtime-capabilities';

import { registerBridgeHandler } from './registerBridgeHandler';
import { createBridgeChannelId } from '../../domain/bridge/BridgeChannelId';
import { createRegistryBackedAssertion } from '../../infrastructure/gates/RegistryBackedAssertion';
import { InMemoryBridgeRegistry } from '../../infrastructure/registry/InMemoryBridgeRegistry';

describe('registerBridgeHandler', () => {
  it('registers when capability is allowed', async () => {
    const cap = createCapabilityId('lua:eval');
    const caps = new InMemoryCapabilityRegistry(createAllowlist([cap]));
    const gate = createRegistryBackedAssertion(caps);
    const registry = new InMemoryBridgeRegistry();
    const channel = createBridgeChannelId('demo');
    const result = await registerBridgeHandler(
      [registry, gate],
      { channel, requiredCapability: cap },
      async () => 42,
    );
    expect(result._tag).toBe('ok');
    await expect(registry.invoke(channel, null)).resolves.toBe(42);
  });

  it('denies when capability is missing', async () => {
    const cap = createCapabilityId('lua:eval');
    const caps = new InMemoryCapabilityRegistry(createAllowlist([]));
    const gate = createRegistryBackedAssertion(caps);
    const registry = new InMemoryBridgeRegistry();
    const result = await registerBridgeHandler(
      [registry, gate],
      { channel: createBridgeChannelId('demo'), requiredCapability: cap },
      async () => 1,
    );
    expect(result._tag).toBe('err');
  });
});
