import { describe, expect, it } from 'vitest';

import { runDuckStyleLifecycleEmulation } from './duckstyleLifecycle.example';

describe('consumer-duckstyle', () => {
  it('duckstyle lifecycle: slot-local script hooks', async () => {
    await expect(runDuckStyleLifecycleEmulation()).resolves.toBeUndefined();
  });
});
