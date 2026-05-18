import { buildDeclarativeBridgeTable } from '@microverse.ts/runtime-bridge';
import type { CapabilityId } from '@microverse.ts/runtime-capabilities';

import type { WithMicroverseScriptContext } from '../../domain/scriptContextSymbol';
import type { HostSurfaceSpec } from '../../domain/hostSurfaceSpecTypes';
import type { SchemaValidationPort } from '../../application/ports/SchemaValidationPort';
import { createFilteredBridgeDeclarations } from './filterBridgeDeclarations';

/**
 * Builds a frozen bridge table for a component profile capability set.
 */
export function buildBridgeMergeEnvForProfile<THost>(
  schemaValidation: SchemaValidationPort,
  host: THost & WithMicroverseScriptContext,
  slotKey: string,
  spec: HostSurfaceSpec,
  capabilities: readonly CapabilityId[],
): Readonly<Record<string, unknown>> {
  const filtered = createFilteredBridgeDeclarations(schemaValidation, spec, capabilities);
  return buildDeclarativeBridgeTable(host, slotKey, [...filtered]);
}
