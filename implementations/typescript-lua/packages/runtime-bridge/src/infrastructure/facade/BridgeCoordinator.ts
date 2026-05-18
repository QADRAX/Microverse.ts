import type { Result } from '@microverse.ts/shared';

import { registerBridgeHandler } from '../../application/useCases/registerBridgeHandler';
import type { BridgeCapabilityAssertion } from '../../domain/bridge/BridgeCapabilityAssertion';
import type { BridgeRegistry } from '../../domain/bridge/BridgeRegistry';
import type { BridgeHandler, BridgeRegistration } from '../../domain/bridge/BridgeMessage';

export type BridgeCoordinatorDeps = {
  readonly registry: BridgeRegistry;
  readonly capabilityAssertion: BridgeCapabilityAssertion;
};

export class BridgeCoordinator {
  constructor(private readonly deps: BridgeCoordinatorDeps) {}

  readonly register = async (
    registration: BridgeRegistration,
    handler: BridgeHandler,
  ): Promise<Result<void, 'duplicate' | 'capability_denied'>> => {
    return registerBridgeHandler([this.deps.registry, this.deps.capabilityAssertion], registration, handler);
  };
}
