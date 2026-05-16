import { buildDeclarativeBridgeTable } from '@microverse.ts/runtime-bridge';

import type { WithMicroverseCapabilityRegistry } from '../../domain/capabilityRegistrySymbol';
import type { WithMicroverseScriptContext } from '../../domain/scriptContextSymbol';
import type { HostSurfaceCore } from '../../domain/hostSurfaceTypes';

/**
 * Builds a frozen `mergeEnv` table: bridge name → API object, ready for `MicroverseSlot.run({ mergeEnv })`.
 *
 * @param host - Your host context, already extended with the capability registry symbol from `@microverse.ts/host-surface`.
 * @param slotKey - Same slot key passed to `buildDeclarativeBridgeTable` (string form of `MicroverseId` is fine).
 * @param surface - Result of {@link defineHostSurface} (implements {@link HostSurfaceCore}).
 */
export function buildBridgeMergeEnvForHost<THost>(
  host: THost & WithMicroverseCapabilityRegistry & WithMicroverseScriptContext,
  slotKey: string,
  surface: HostSurfaceCore,
): Readonly<Record<string, unknown>> {
  return buildDeclarativeBridgeTable(host, slotKey, [...surface.toBridgeDeclarations()]);
}

/** Bridge table names for `__microverse_bridge_names` in the slot env. */
export function bridgeNamesFromSurface(surface: HostSurfaceCore): readonly string[] {
  return surface.toBridgeDeclarations().map((d) => d.name);
}
