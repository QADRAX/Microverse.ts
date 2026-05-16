import { describe, expect, it } from 'vitest';

import { MicroverseLua } from './microverseLuaNamespace';

describe('MicroverseLua', () => {
  it('exposes create (alias of createLuaMicroverse)', () => {
    expect(typeof MicroverseLua.create).toBe('function');
  });
});
