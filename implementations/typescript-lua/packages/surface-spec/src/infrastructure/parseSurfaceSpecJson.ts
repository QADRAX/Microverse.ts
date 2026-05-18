import type { SurfaceSpecDocument } from '../domain/SurfaceSpecDocument';
import { validateSurfaceSpecDocument } from '../application/validateSurfaceSpecDocument';

export function parseSurfaceSpecJson(raw: string): SurfaceSpecDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    throw new Error(`invalid SurfaceSpec JSON: ${message}`);
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('SurfaceSpec JSON must be an object');
  }
  const doc = parsed as SurfaceSpecDocument;
  validateSurfaceSpecDocument(doc);
  return doc;
}
