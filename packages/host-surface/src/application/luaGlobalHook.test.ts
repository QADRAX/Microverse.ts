import { describe, expect, it } from 'vitest';

import { luaGlobalHookName } from './luaGlobalHook';

describe('luaGlobalHookName', () => {
  it('prefixes PascalCase kind with on', () => {
    expect(luaGlobalHookName('OrderPlaced')).toBe('onOrderPlaced');
    expect(luaGlobalHookName('InventoryLow')).toBe('onInventoryLow');
  });

  it('rejects unsafe kinds', () => {
    expect(() => luaGlobalHookName('bad;drop' as 'bad;drop')).toThrow(/unsafe Lua identifier/);
  });
});
