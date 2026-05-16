import { buildLuaCatsDocument } from '../domain/luaCats/buildLuaCatsDocument';
import { parseManifestJson } from '../domain/manifest/parseManifestJson';

import type { LuaDefinitionsFromManifestFilePorts } from '../application/ports/LuaDefinitionsFromManifestFilePorts';

import { createNodeFileSystemPort } from './adapters/nodeFileSystemAdapter';

/**
 * Composición por defecto (Node): `[fs, parseManifest, buildLuaCatsDocument]`.
 */
export function createDefaultLuaDefinitionsFromManifestFilePorts(): LuaDefinitionsFromManifestFilePorts {
  return [createNodeFileSystemPort(), parseManifestJson, buildLuaCatsDocument];
}
