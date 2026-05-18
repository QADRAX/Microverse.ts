import type { CapabilityId } from '@microverse.ts/runtime-capabilities';

export type BridgeCapabilityAssertion = {
  readonly assertAllowed: (id: CapabilityId) => Promise<void>;
};
