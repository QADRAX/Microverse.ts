import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildLuaCatsDocument } from '@microverse.ts/lua-defs';
import { buildScriptCatalogLuaDefManifest } from '@microverse.ts/microverse-lua';

import { SORTING_PROFILE_ID, sortingScriptIds } from './engine/sortingScriptCatalog';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = join(root, 'generated', 'sortingScriptCatalog.d.lua');

const manifest = buildScriptCatalogLuaDefManifest(
  sortingScriptIds.map((scriptId) => ({ scriptId, profileId: SORTING_PROFILE_ID })),
);
const body = buildLuaCatsDocument({
  ...manifest,
  output: 'generated/sortingScriptCatalog.d.lua',
  headerNote:
    'Per-scriptId aliases for lua/*.lua — use ---@type bubble_sortScriptComponent with SortingAlgorithm:extend().',
});

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, body, 'utf8');
console.log(`Wrote ${outPath}`);
