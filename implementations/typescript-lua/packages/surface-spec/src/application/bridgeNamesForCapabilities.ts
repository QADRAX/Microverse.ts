import type { SurfaceSpecDocument } from '../domain/SurfaceSpecDocument';

/** Bridge table names that expose at least one method requiring a capability from the set. */
export function bridgeNamesForCapabilities(
  doc: SurfaceSpecDocument,
  capabilities: readonly string[],
): readonly string[] {
  const allowed = new Set(capabilities);
  const names: string[] = [];
  for (const bridgeName of Object.keys(doc.bridges)) {
    const methods = doc.bridges[bridgeName]!.methods;
    for (const methodName of Object.keys(methods)) {
      if (allowed.has(methods[methodName]!.requires)) {
        names.push(bridgeName);
        break;
      }
    }
  }
  return names.sort((a, b) => a.localeCompare(b));
}
