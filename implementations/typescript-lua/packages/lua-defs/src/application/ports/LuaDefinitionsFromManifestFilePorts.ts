import type { FileSystemPort } from './FileSystemPort';
import type { LuaCatsDocumentBuilderPort } from './LuaCatsDocumentBuilderPort';
import type { ManifestParserPort } from './ManifestParserPort';

/**
 * Puertos compartidos por los casos de uso que leen un manifiesto desde disco.
 * Orden del tuple: `[fs, parseManifest, buildLuaCatsDocument]`.
 */
export type LuaDefinitionsFromManifestFilePorts = readonly [
  FileSystemPort,
  ManifestParserPort,
  LuaCatsDocumentBuilderPort,
];
