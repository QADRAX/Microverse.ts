import type { AsyncUseCase } from '@microverse.ts/shared';
import { err, ok, type Result } from '@microverse.ts/shared';

import type { BridgeRegistryPort } from '../ports/BridgeRegistryPort';
import type { BridgeCapabilityAssertion } from '../../domain/bridge/BridgeCapabilityAssertion';
import type { BridgeHandler, BridgeRegistration } from '../../domain/bridge/BridgeMessage';

export type RegisterBridgeHandlerPorts = readonly [BridgeRegistryPort, BridgeCapabilityAssertion];

/**
 * Port tuple order: `[BridgeRegistryPort, BridgeCapabilityAssertion]`.
 */
export const registerBridgeHandler: AsyncUseCase<
  RegisterBridgeHandlerPorts,
  readonly [BridgeRegistration, BridgeHandler],
  Result<void, 'duplicate' | 'capability_denied'>
> = async (ports, registration, handler) => {
  const [registry, gate] = ports;
  if (registration.requiredCapability) {
    try {
      await gate.assertAllowed(registration.requiredCapability);
    } catch {
      return err('capability_denied');
    }
  }
  try {
    registry.register(registration.channel, handler);
  } catch {
    return err('duplicate');
  }
  return ok(undefined);
};
