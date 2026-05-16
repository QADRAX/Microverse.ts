import type { CapabilityId } from '@microverse.ts/runtime-capabilities';

import type { BridgeCapabilityAssertion } from '../../domain/bridge/BridgeCapabilityAssertion';

export function createRegistryBackedAssertion(input: {
  readonly isAllowed: (id: CapabilityId) => boolean;
}): BridgeCapabilityAssertion {
  return {
    assertAllowed: async (id) => {
      if (!input.isAllowed(id)) {
        throw new Error('denied');
      }
    },
  };
}
