import { describe, expect, it } from 'vitest';

import { runTwoSlotsWasmExample } from './twoSlotsWasm.example';

describe('consumer-minimal', () => {
  it('twoSlotsWasm: per-slot env isolation', async () => {
    await expect(runTwoSlotsWasmExample()).resolves.toBeUndefined();
  });
});
