import type { AsyncUseCase } from '@microverse.ts/shared';
import { err, ok, type Result } from '@microverse.ts/shared';

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
