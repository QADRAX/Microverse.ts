import { loadLuaDefinitionsDocumentFromManifestFile } from '../application/useCases/loadLuaDefinitionsDocumentFromManifestFile.js';

import { createDefaultLuaDefinitionsFromManifestFilePorts } from './defaultLuaDefinitionsPorts.js';

export type LoadLuaDefinitionsFromManifestFileOptions = {
  readonly cwd: string;
  readonly manifestPath: string;
};

/**
 * Lee el manifiesto desde disco y devuelve el `.d.lua` como string (Node por defecto).
 */
export async function loadLuaDefinitionsFromManifestFile(
  options: LoadLuaDefinitionsFromManifestFileOptions,
): Promise<string> {
  return loadLuaDefinitionsDocumentFromManifestFile(createDefaultLuaDefinitionsFromManifestFilePorts(), options);
}
