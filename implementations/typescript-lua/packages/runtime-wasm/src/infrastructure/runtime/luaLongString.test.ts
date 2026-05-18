import { describe, expect, it } from 'vitest';

import { toLuaLongStringLiteral } from './luaLongString';

describe('toLuaLongStringLiteral', () => {
  it('wraps plain text', () => {
    expect(toLuaLongStringLiteral('a')).toBe('[[a]]');
  });

  it('adds equals when content contains the closing delimiter', () => {
    const s = 'x]]y';
    const lit = toLuaLongStringLiteral(s);
    expect(lit.startsWith('[=[')).toBe(true);
    expect(lit.endsWith(']=]')).toBe(true);
    expect(lit).toContain(s);
  });
});
