import type { LuaDefManifest } from '../../domain/manifest/LuaDefManifest.js';

export type ManifestParserPort = (raw: string) => LuaDefManifest;
