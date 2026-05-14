import type { AsyncUseCase } from '@luarizer/shared';
import { err, ok, type Result } from '@luarizer/shared';

import type { CapabilityRegistryPort } from '../ports/CapabilityRegistryPort';
import type { CapabilityId } from '../../domain/capabilities/CapabilityId';

export type EvaluateCapabilityPorts = readonly [CapabilityRegistryPort];

/**
 * Port tuple order: `[CapabilityRegistryPort]`.
 */
export const evaluateCapability: AsyncUseCase<
  EvaluateCapabilityPorts,
  readonly [CapabilityId],
  Result<void, 'denied'>
> = async (ports, id) => {
  const [registry] = ports;
  return registry.isAllowed(id) ? ok(undefined) : err('denied');
};
