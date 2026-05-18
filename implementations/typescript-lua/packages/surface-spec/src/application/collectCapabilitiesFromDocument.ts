import type { SurfaceSpecDocument } from '../domain/SurfaceSpecDocument';

/** Every `requires` capability on bridge methods in a {@link SurfaceSpecDocument}. */
export function collectCapabilitiesFromDocument(
  doc: SurfaceSpecDocument,
): readonly string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const bridgeName of Object.keys(doc.bridges).sort((a, b) => a.localeCompare(b))) {
    const methods = doc.bridges[bridgeName]!.methods;
    for (const methodName of Object.keys(methods)) {
      const cap = methods[methodName]!.requires;
      if (!seen.has(cap)) {
        seen.add(cap);
        out.push(cap);
      }
    }
  }
  return out;
}
