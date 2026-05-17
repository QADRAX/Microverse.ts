import { describe, expect, it } from 'vitest';

import { chessLuaScriptPath, chessLuaSource, chessLuaSources } from './chessLuaBundle';

describe('chessLuaBundle', () => {
  it('maps script ids to repo paths and Wasm-loaded sources', () => {
    expect(chessLuaScriptPath('random_move')).toBe('lua/random_move.lua');
    expect(chessLuaSource('minimax_depth1')).toContain('function C:onPickMove');
    expect(Object.keys(chessLuaSources)).toHaveLength(13);
  });
});
