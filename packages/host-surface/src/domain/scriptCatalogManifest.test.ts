import { describe, expect, it } from 'vitest';

import { buildScriptCatalogLuaDefManifest, scriptCatalogComponentAlias } from './scriptCatalogManifest';

describe('buildScriptCatalogLuaDefManifest', () => {
  it('omits alias when entry.localComponentClass is true', () => {
    const manifest = buildScriptCatalogLuaDefManifest([
      { scriptId: 'random_move', profileId: 'ChessEngine', localComponentClass: true },
      { scriptId: 'first_legal', profileId: 'ChessEngine' },
    ]);

    expect(manifest.aliases).toEqual([
      { name: 'first_legalScriptComponent', definition: 'ChessEngineComponent' },
    ]);
  });
});

describe('scriptCatalogComponentAlias', () => {
  it('suffixes ScriptComponent after sanitizing scriptId', () => {
    expect(scriptCatalogComponentAlias('random_move')).toBe('random_moveScriptComponent');
  });
});
