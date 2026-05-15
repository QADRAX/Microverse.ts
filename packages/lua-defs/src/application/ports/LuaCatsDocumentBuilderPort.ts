import type { LuaDefManifest } from '../../domain/manifest/LuaDefManifest.js';

export type LuaCatsDocumentBuilderPort = (manifest: LuaDefManifest) => string;
