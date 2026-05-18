import type { LuaDefManifest } from './LuaDefManifest';

export function parseManifestJson(raw: string): LuaDefManifest {
  const data: unknown = JSON.parse(raw);
  if (typeof data !== 'object' || data === null) {
    throw new Error('manifest: root must be an object');
  }
  const o = data as Record<string, unknown>;
  if (o.schemaVersion !== 1) {
    throw new Error('manifest: schemaVersion must be 1');
  }
  if (typeof o.output !== 'string' || o.output.length === 0) {
    throw new Error('manifest: output must be a non-empty string');
  }
  return data as LuaDefManifest;
}
