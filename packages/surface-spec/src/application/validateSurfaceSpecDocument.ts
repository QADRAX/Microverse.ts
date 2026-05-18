import type { SurfaceSpecDocument } from '../domain/SurfaceSpecDocument';
import { collectCapabilitiesFromDocument } from './collectCapabilitiesFromDocument';

function assertSafeKey(kind: string, key: string): void {
  if (!/^[A-Za-z_]\w*$/.test(key)) {
    throw new Error(`${kind} name is not a safe identifier: ${JSON.stringify(key)}`);
  }
}

/**
 * Validates structural consistency of a {@link SurfaceSpecDocument}
 * (capabilities, hooks, extends references).
 */
export function validateSurfaceSpecDocument(doc: SurfaceSpecDocument): void {
  if (doc.schemaVersion !== 1) {
    throw new Error(`unsupported surface spec schemaVersion: ${String(doc.schemaVersion)}`);
  }

  const surfaceCaps = new Set(collectCapabilitiesFromDocument(doc));
  const declaredCaps = new Set(doc.capabilities.map(String));
  for (const cap of surfaceCaps) {
    if (!declaredCaps.has(cap)) {
      throw new Error(
        `surface spec capabilities[] missing method capability: ${cap}`,
      );
    }
  }

  const hookKinds =
    doc.componentHooks !== undefined
      ? new Set(Object.keys(doc.componentHooks))
      : new Set<string>();

  for (const name of Object.keys(doc.componentTypes)) {
    assertSafeKey('componentType', name);
    const profile = doc.componentTypes[name]!;

    if (profile.extends !== undefined) {
      assertSafeKey('componentType', profile.extends);
      if (doc.componentTypes[profile.extends] === undefined) {
        throw new Error(`component type "${name}" extends unknown type "${profile.extends}"`);
      }
    }

    for (const cap of profile.capabilities) {
      if (!surfaceCaps.has(cap) && !declaredCaps.has(cap)) {
        throw new Error(
          `component type "${name}": capability not declared on surface: ${cap}`,
        );
      }
    }

    for (const hook of profile.hooks) {
      if (!hookKinds.has(hook)) {
        throw new Error(
          `component type "${name}": hook "${hook}" not declared in componentHooks`,
        );
      }
    }

    for (const bridgeName of profile.bridgeNames) {
      if (doc.bridges[bridgeName] === undefined) {
        throw new Error(
          `component type "${name}": bridgeNames references unknown bridge "${bridgeName}"`,
        );
      }
    }
  }
}
