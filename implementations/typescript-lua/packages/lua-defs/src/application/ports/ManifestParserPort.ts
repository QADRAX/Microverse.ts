import type { LuaDefManifest } from '../../domain/manifest/LuaDefManifest';

export type ManifestParserPort = (raw: string) => LuaDefManifest;
