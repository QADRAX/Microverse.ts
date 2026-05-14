import type { FileSystemPort } from './FileSystemPort.js';
import type { LuaCatsDocumentBuilderPort } from './LuaCatsDocumentBuilderPort.js';
import type { ManifestParserPort } from './ManifestParserPort.js';

/**
 * Puertos compartidos por los casos de uso que leen un manifiesto desde disco.
 * Orden del tuple: `[fs, parseManifest, buildLuaCatsDocument]`.
 */
export type LuaDefinitionsFromManifestFilePorts = readonly [
  FileSystemPort,
  ManifestParserPort,
  LuaCatsDocumentBuilderPort,
];
