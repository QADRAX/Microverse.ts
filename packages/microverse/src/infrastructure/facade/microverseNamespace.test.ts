import { describe, expect, it } from 'vitest';

import { Microverse } from './microverseNamespace';

describe('Microverse namespace', () => {
  it('exposes createWasmRuntime', () => {
    expect(typeof Microverse.createWasmRuntime).toBe('function');
  });

  it('exposes createLuaMicroverse', () => {
    expect(typeof Microverse.createLuaMicroverse).toBe('function');
  });
});
