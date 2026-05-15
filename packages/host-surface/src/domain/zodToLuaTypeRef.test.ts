import { z } from 'zod';
import { describe, expect, it } from 'vitest';

import { zodToLuaTypeRef } from './zodToLuaTypeRef.js';

describe('zodToLuaTypeRef', () => {
  it('maps primitives', () => {
    expect(zodToLuaTypeRef(z.string())).toBe('string');
    expect(zodToLuaTypeRef(z.number())).toBe('number');
    expect(zodToLuaTypeRef(z.boolean())).toBe('boolean');
    expect(zodToLuaTypeRef(z.unknown())).toBe('unknown');
  });

  it('maps object to inline LuaCATS record', () => {
    expect(zodToLuaTypeRef(z.object({ a: z.string() }))).toBe('{ a: string }');
    expect(zodToLuaTypeRef(z.object({ a: z.string(), b: z.number() }))).toBe('{ a: string; b: number }');
  });

  it('maps optional and nullable', () => {
    expect(zodToLuaTypeRef(z.string().nullable())).toBe('string|nil');
    expect(zodToLuaTypeRef(z.number().optional())).toBe('number|nil');
  });

  it('maps enums', () => {
    expect(zodToLuaTypeRef(z.enum(['a', 'b']))).toBe('"a"|"b"');
  });
});
