import { describe, expect, it } from 'vitest';

import { sortingLuaScriptPath, sortingLuaSource, sortingLuaSources } from './sortingLuaBundle';

describe('sortingLuaBundle', () => {
  it('maps script ids to repo paths and Wasm-loaded sources', () => {
    expect(sortingLuaScriptPath('quick_sort')).toBe('lua/quick_sort.lua');
    expect(sortingLuaSource('bubble_sort')).toContain('function C:onTick');
    expect(sortingLuaSource('merge_sort')).toContain('function C:onTick');
    expect(Object.keys(sortingLuaSources)).toHaveLength(11);
  });
});
