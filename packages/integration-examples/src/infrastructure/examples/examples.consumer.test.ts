import { describe, expect, it } from 'vitest';

import { runDeclarativeBridgesExample } from './declarativeBridges.example';
import { runDuckStyleLifecycleEmulation } from './duckstyle-emulation/duckstyleEmulation.example';
import { runTwoSlotsWasmExample } from './twoSlotsWasm.example';

describe('consumer examples (via @luarizer/luarizer only)', () => {
  it('twoSlotsWasm: per-slot env isolation', async () => {
    await expect(runTwoSlotsWasmExample()).resolves.toBeUndefined();
  });

  it('declarativeBridges: composed API', () => {
    expect(runDeclarativeBridgesExample().ping).toBe('demo:slot-x');
  });

  it('duckstyle emulation: toy subsystem + Luarizer-backed sandbox', async () => {
    await expect(runDuckStyleLifecycleEmulation()).resolves.toBeUndefined();
  });
});
