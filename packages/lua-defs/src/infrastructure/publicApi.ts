/**
 * API pública del paquete: composición en infraestructura (Node) + re-export de dominio y puertos.
 * El entry `src/index.ts` solo re-exporta desde aquí.
 */
export type {
  LuaDefManifest,
  LuaPrimitiveType,
  LuaTypeRef,
  ManifestAlias,
  ManifestClass,
  ManifestClassField,
  ManifestGlobal,
  ManifestGlobalField,
  ManifestLuaHook,
  ManifestMethod,
  ManifestParam,
} from '../domain/manifest/LuaDefManifest';
export { parseManifestJson } from '../domain/manifest/parseManifestJson';
export { buildLuaCatsDocument, buildLuaCatsDocument as emitLuaCatsFromManifest } from '../domain/luaCats/buildLuaCatsDocument';

export type { FileSystemPort } from '../application/ports/FileSystemPort';
export type { LuaCatsDocumentBuilderPort } from '../application/ports/LuaCatsDocumentBuilderPort';
export type { ManifestParserPort } from '../application/ports/ManifestParserPort';
export type { LuaDefinitionsFromManifestFilePorts } from '../application/ports/LuaDefinitionsFromManifestFilePorts';

export {
  generateLuaDefinitionsFile,
  type GenerateLuaDefinitionsFileInput,
  type GenerateLuaDefinitionsFileUseCase,
} from '../application/useCases/generateLuaDefinitionsFile';
export {
  loadLuaDefinitionsDocumentFromManifestFile,
  type LoadLuaDefinitionsDocumentFromManifestFileInput,
  type LoadLuaDefinitionsDocumentFromManifestFileUseCase,
} from '../application/useCases/loadLuaDefinitionsDocumentFromManifestFile';

export { createNodeFileSystemPort } from './adapters/nodeFileSystemAdapter';
export { createDefaultLuaDefinitionsFromManifestFilePorts } from './defaultLuaDefinitionsPorts';
export { generateDefs, type GenerateDefsOptions } from './generateDefs';
export {
  writeLuaDefinitionsFromManifest,
  type WriteLuaDefinitionsFromManifestOptions,
} from './writeLuaDefinitionsFromManifest';
export { loadLuaDefinitionsFromManifestFile, type LoadLuaDefinitionsFromManifestFileOptions } from './loadLuaDefinitionsFromManifestFile';
