import { buildDeclarativeBridgeTable } from '@microverse.ts/runtime-bridge';

import type { WithMicroverseCapabilityRegistry } from '../../domain/capabilityRegistrySymbol.js';
import type { HostSurfaceCore } from '../../domain/hostSurfaceTypes.js';

/**
 * Builds a frozen `mergeEnv` table: bridge name → API object, ready for `MicroverseSlot.run({ mergeEnv })`.
 *
 * @param host - Your host context, already extended with the capability registry symbol from `@microverse.ts/host-surface`.
 * @param slotKey - Same slot key passed to `buildDeclarativeBridgeTable` (string form of `MicroverseId` is fine).
 * @param surface - Result of {@link defineHostSurface} (implements {@link HostSurfaceCore}).
 */
export function buildBridgeMergeEnvForHost<THost>(
  host: THost & WithMicroverseCapabilityRegistry,
  slotKey: string,
  surface: HostSurfaceCore,
): Readonly<Record<string, unknown>> {
  return buildDeclarativeBridgeTable(host, slotKey, [...surface.toBridgeDeclarations()]);
}
