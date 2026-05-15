import { buildDeclarativeBridgeTable } from '@luarizer/runtime-bridge';

import type { WithLuarizerCapabilityRegistry } from '../../domain/capabilityRegistrySymbol.js';
import type { HostSurfaceCore } from '../../domain/hostSurfaceTypes.js';

/**
 * Builds a frozen `mergeEnv` table: bridge name → API object, ready for `Sandbox.run({ mergeEnv })`.
 *
 * @param host - Your host context, already extended with the capability registry symbol from `@luarizer/host-surface`.
 * @param slotKey - Same slot key passed to `buildDeclarativeBridgeTable` (string form of `SandboxId` is fine).
 * @param surface - Result of {@link defineHostSurface} (implements {@link HostSurfaceCore}).
 */
export function buildBridgeMergeEnvForHost<THost>(
  host: THost & WithLuarizerCapabilityRegistry,
  slotKey: string,
  surface: HostSurfaceCore,
): Readonly<Record<string, unknown>> {
  return buildDeclarativeBridgeTable(host, slotKey, [...surface.toBridgeDeclarations()]);
}
