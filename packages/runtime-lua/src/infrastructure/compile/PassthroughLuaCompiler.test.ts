import { describe, expect, it } from 'vitest';

import { createLuaChunk } from '../../domain/lua/LuaChunk';
import { PassthroughLuaCompiler } from './PassthroughLuaCompiler';

describe('PassthroughLuaCompiler', () => {
  it('rejects empty chunks', () => {
    const c = new PassthroughLuaCompiler();
    expect(c.validate(createLuaChunk(''))).toBe(false);
    expect(c.validate(createLuaChunk('a'))).toBe(true);
  });
});
