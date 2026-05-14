import type { LuarizerDefManifest } from '../../domain/manifest/LuarizerDefManifest.js';

export type LuaCatsDocumentBuilderPort = (manifest: LuarizerDefManifest) => string;
