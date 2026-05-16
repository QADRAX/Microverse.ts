import type { DeclarativeBridgeDeclaration } from '@microverse.ts/runtime-bridge';
import type { CapabilityId } from '@microverse.ts/runtime-capabilities';

import type { HostSurfaceSpec } from '../../domain/hostSurfaceTypes';
import type { SchemaValidationPort } from '../../application/ports/SchemaValidationPort';
import { createBridgeDeclarationsFromHostSurfaceSpec } from '../../application/useCases/compileBridgeDeclarationsFromHostSurfaceSpec';

/**
 * Keeps bridge declarations (and methods) whose capability is in the allow set.
 */
export function filterBridgeDeclarationsByCapabilities<
  THost,
  TSlotKey extends string,
>(
  declarations: readonly DeclarativeBridgeDeclaration<THost, TSlotKey>[],
  spec: HostSurfaceSpec,
  capabilities: readonly CapabilityId[],
): DeclarativeBridgeDeclaration<THost, TSlotKey>[] {
  const allowed = new Set(capabilities.map((c) => String(c)));
  const bridgeNames = new Set<string>();
  for (const bridgeName of Object.keys(spec)) {
    const methods = spec[bridgeName]!;
    for (const methodName of Object.keys(methods)) {
      const entry = methods[methodName]!;
      if (allowed.has(String(entry.capability))) {
        bridgeNames.add(bridgeName);
        break;
      }
    }
  }

  return declarations
    .filter((d) => bridgeNames.has(d.name))
    .map((d) => ({
      ...d,
      createApi: (host: THost, slotKey: TSlotKey) => {
        const api = d.createApi(host, slotKey) as Record<string, unknown>;
        const methods = spec[d.name]!;
        const filtered: Record<string, unknown> = {};
        for (const methodName of Object.keys(api)) {
          const entry = methods[methodName];
          if (entry !== undefined && allowed.has(String(entry.capability))) {
            filtered[methodName] = api[methodName];
          }
        }
        return Object.freeze(filtered);
      },
    }));
}

export function createFilteredBridgeDeclarations(
  schemaValidation: SchemaValidationPort,
  spec: HostSurfaceSpec,
  capabilities: readonly CapabilityId[],
): ReturnType<typeof createBridgeDeclarationsFromHostSurfaceSpec> {
  const all = createBridgeDeclarationsFromHostSurfaceSpec(schemaValidation, spec);
  return filterBridgeDeclarationsByCapabilities(all, spec, capabilities);
}
