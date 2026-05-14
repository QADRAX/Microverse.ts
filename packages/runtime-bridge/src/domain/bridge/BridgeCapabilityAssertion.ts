import type { CapabilityId } from '@luarizer/runtime-capabilities';

export type BridgeCapabilityAssertion = {
  readonly assertAllowed: (id: CapabilityId) => Promise<void>;
};
