import { z } from 'zod';
import { describe, expect, it } from 'vitest';

import { luaType, resolveZodLuaTypeAlias } from './zodLuaType';
import { zodToLuaTypeRef } from './zodToLuaTypeRef';

describe('luaType', () => {
  it('registers a nominal name used by zodToLuaTypeRef', () => {
    const orderDto = luaType(
      'OrderDto',
      z.object({
        id: z.string(),
      }),
    );
    expect(zodToLuaTypeRef(orderDto)).toBe('OrderDto');
    expect(zodToLuaTypeRef(orderDto.optional())).toBe('OrderDto|nil');
    expect(resolveZodLuaTypeAlias(orderDto)).toBe('OrderDto');
  });

  it('rejects invalid alias names', () => {
    expect(() => luaType('not-valid', z.string())).toThrow(/invalid alias name/);
  });
});
