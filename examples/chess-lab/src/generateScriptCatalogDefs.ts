import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildLuaCatsDocument } from '@microverse.ts/lua-defs';
import { buildScriptCatalogLuaDefManifest } from '@microverse.ts/microverse-lua';

import { CHESS_PROFILE_ID, chessScriptIds } from './engine/chessScriptCatalog';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = join(root, 'generated', 'chessScriptCatalog.d.lua');

const manifest = buildScriptCatalogLuaDefManifest(
  chessScriptIds.map((scriptId) => ({ scriptId, profileId: CHESS_PROFILE_ID })),
);
const body = buildLuaCatsDocument({
  ...manifest,
  output: 'generated/chessScriptCatalog.d.lua',
  headerNote:
    'Per-scriptId aliases for lua/*.lua — use ---@class fooScriptComponent : ChessEngineComponent when adding script-local methods.',
});

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, body, 'utf8');
console.log(`Wrote ${outPath}`);
