import { buildLuaCatsDocument } from '../domain/luaCats/buildLuaCatsDocument.js';
import { parseManifestJson } from '../domain/manifest/parseManifestJson.js';

import type { LuaDefinitionsFromManifestFilePorts } from '../application/ports/LuaDefinitionsFromManifestFilePorts.js';

import { createNodeFileSystemPort } from './adapters/nodeFileSystemAdapter.js';

/**
 * Composición por defecto (Node): `[fs, parseManifest, buildLuaCatsDocument]`.
 */
export function createDefaultLuaDefinitionsFromManifestFilePorts(): LuaDefinitionsFromManifestFilePorts {
  return [createNodeFileSystemPort(), parseManifestJson, buildLuaCatsDocument];
}
