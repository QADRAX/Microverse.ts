/**
 * API pública del paquete: composición en infraestructura (Node) + re-export de dominio y puertos.
 * El entry `src/index.ts` solo re-exporta desde aquí.
 */
export type {
  LuarizerDefManifest,
  LuaPrimitiveType,
  LuaTypeRef,
  ManifestAlias,
  ManifestClass,
  ManifestClassField,
  ManifestGlobal,
  ManifestGlobalField,
  ManifestMethod,
  ManifestParam,
} from '../domain/manifest/LuarizerDefManifest.js';
export { parseManifestJson } from '../domain/manifest/parseManifestJson.js';
export { buildLuaCatsDocument, buildLuaCatsDocument as emitLuaCatsFromManifest } from '../domain/luaCats/buildLuaCatsDocument.js';

export type { FileSystemPort } from '../application/ports/FileSystemPort.js';
export type { LuaCatsDocumentBuilderPort } from '../application/ports/LuaCatsDocumentBuilderPort.js';
export type { ManifestParserPort } from '../application/ports/ManifestParserPort.js';
export type { LuaDefinitionsFromManifestFilePorts } from '../application/ports/LuaDefinitionsFromManifestFilePorts.js';

export {
  generateLuaDefinitionsFile,
  type GenerateLuaDefinitionsFileInput,
  type GenerateLuaDefinitionsFileUseCase,
} from '../application/useCases/generateLuaDefinitionsFile.js';
export {
  loadLuaDefinitionsDocumentFromManifestFile,
  type LoadLuaDefinitionsDocumentFromManifestFileInput,
  type LoadLuaDefinitionsDocumentFromManifestFileUseCase,
} from '../application/useCases/loadLuaDefinitionsDocumentFromManifestFile.js';

export { createNodeFileSystemPort } from './adapters/nodeFileSystemAdapter.js';
export { createDefaultLuaDefinitionsFromManifestFilePorts } from './defaultLuaDefinitionsPorts.js';
export { generateDefs, type GenerateDefsOptions } from './generateDefs.js';
export {
  writeLuaDefinitionsFromManifest,
  type WriteLuaDefinitionsFromManifestOptions,
} from './writeLuaDefinitionsFromManifest.js';
export { loadLuaDefinitionsFromManifestFile, type LoadLuaDefinitionsFromManifestFileOptions } from './loadLuaDefinitionsFromManifestFile.js';
