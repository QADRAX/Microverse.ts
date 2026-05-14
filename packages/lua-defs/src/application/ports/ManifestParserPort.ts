import type { LuarizerDefManifest } from '../../domain/manifest/LuarizerDefManifest.js';

export type ManifestParserPort = (raw: string) => LuarizerDefManifest;
