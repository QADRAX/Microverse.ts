import { describe, expect, it } from 'vitest';

import { Microverse } from './microverseNamespace';

describe('Microverse namespace', () => {
  it('exposes createWasmRuntime', () => {
    expect(typeof Microverse.createWasmRuntime).toBe('function');
  });

  it('exposes createHostWorkflowHub', () => {
    expect(typeof Microverse.createHostWorkflowHub).toBe('function');
  });
});
