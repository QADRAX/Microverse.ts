import { describe, expect, it } from 'vitest';

import { luaGlobalHookName } from './luaGlobalHook';

describe('luaGlobalHookName', () => {
  it('prefixes PascalCase kind with on', () => {
    expect(luaGlobalHookName('OrderPlaced')).toBe('onOrderPlaced');
    expect(luaGlobalHookName('InventoryLow')).toBe('onInventoryLow');
  });

  it('rejects unsafe kinds', () => {
    const unsafe = 'bad;drop';
    expect(() => luaGlobalHookName(unsafe)).toThrow(/unsafe Lua identifier/);
  });
});
