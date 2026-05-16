import type { LuaDefManifest } from '../../domain/manifest/LuaDefManifest';

export type LuaCatsDocumentBuilderPort = (manifest: LuaDefManifest) => string;
