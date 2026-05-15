import type { CapabilityId } from '@microverse/runtime-capabilities';

export type BridgeCapabilityAssertion = {
  readonly assertAllowed: (id: CapabilityId) => Promise<void>;
};
