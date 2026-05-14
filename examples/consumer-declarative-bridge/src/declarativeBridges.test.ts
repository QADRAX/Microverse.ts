import { describe, expect, it } from 'vitest';

import { runDbBridgeDeclarativeWasmExample } from './dbBridgeDeclarativeWasm.example';
import { runDeclarativeBridgesExample } from './declarativeBridges.example';

describe('consumer-declarative-bridge', () => {
  it('dbBridgeDeclarativeWasm: mergeEnv + declarative Data bridge', async () => {
    await expect(runDbBridgeDeclarativeWasmExample()).resolves.toBeUndefined();
  });

  it('declarativeBridges: composed API', () => {
    expect(runDeclarativeBridgesExample().ping).toBe('demo:slot-x');
  });
});
