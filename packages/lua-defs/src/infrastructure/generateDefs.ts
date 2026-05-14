import { generateLuaDefinitionsFile } from '../application/useCases/generateLuaDefinitionsFile.js';

import { createDefaultLuaDefinitionsFromManifestFilePorts } from './defaultLuaDefinitionsPorts.js';

export type GenerateDefsOptions = {
  readonly cwd: string;
  readonly manifestPath: string;
  /** Overrides manifest.output when set */
  readonly outPath?: string | undefined;
};

/**
 * Lee el manifiesto desde disco, genera `.d.lua` y lo escribe (Node por defecto).
 */
export async function generateDefs(options: GenerateDefsOptions): Promise<{ readonly written: string }> {
  return generateLuaDefinitionsFile(createDefaultLuaDefinitionsFromManifestFilePorts(), options);
}
