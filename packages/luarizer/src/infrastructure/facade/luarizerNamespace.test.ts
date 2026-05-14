import { describe, expect, it } from 'vitest';

import { Luarizer } from './luarizerNamespace';

describe('Luarizer namespace', () => {
  it('exposes createWasmRuntime', () => {
    expect(typeof Luarizer.createWasmRuntime).toBe('function');
  });

  it('exposes createHostWorkflowHub', () => {
    expect(typeof Luarizer.createHostWorkflowHub).toBe('function');
  });
});
