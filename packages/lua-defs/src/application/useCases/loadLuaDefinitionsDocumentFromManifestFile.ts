import type { AsyncUseCase } from '@microverse.ts/shared';

import type { LuaDefinitionsFromManifestFilePorts } from '../ports/LuaDefinitionsFromManifestFilePorts.js';

export type LoadLuaDefinitionsDocumentFromManifestFileInput = {
  readonly cwd: string;
  readonly manifestPath: string;
};

export type LoadLuaDefinitionsDocumentFromManifestFileUseCase = AsyncUseCase<
  LuaDefinitionsFromManifestFilePorts,
  readonly [LoadLuaDefinitionsDocumentFromManifestFileInput],
  string
>;

/**
 * Lee el manifiesto JSON desde disco y devuelve el contenido `.d.lua` (sin escribir fichero).
 *
 * Puertos (tuple): `[fs, parseManifest, buildLuaCatsDocument]`.
 */
export async function loadLuaDefinitionsDocumentFromManifestFile(
  ports: LuaDefinitionsFromManifestFilePorts,
  input: LoadLuaDefinitionsDocumentFromManifestFileInput,
): Promise<string> {
  const [fs, parseManifest, buildLuaCatsDocument] = ports;
  const absManifest = fs.resolve(input.cwd, input.manifestPath);
  const raw = await fs.readTextFile(absManifest);
  const manifest = parseManifest(raw);
  return buildLuaCatsDocument(manifest);
}
