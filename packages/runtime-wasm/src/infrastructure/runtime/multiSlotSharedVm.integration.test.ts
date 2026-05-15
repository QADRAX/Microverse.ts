import {
  ConsoleLogger,
  createMicroverseId,
  createMicroverseScript,
  createStubMicroverseRuntime,
} from '@microverse/runtime-core';
import { describe, expect, it } from 'vitest';

import { WasmoonRuntimeAdapter } from './WasmoonRuntimeAdapter';

describe('Wasmoon multi-slot shared VM', () => {
  it('isolates globals per slot in one LuaEngine', async () => {
    const adapter = new WasmoonRuntimeAdapter();
    const runtime = createStubMicroverseRuntime({
      adapter,
      logger: new ConsoleLogger(),
    });

    const slotA = createMicroverseId('slot-a');
    const slotB = createMicroverseId('slot-b');
    const sandboxA = await runtime.createMicroverse({ slotKey: slotA });
    const sandboxB = await runtime.createMicroverse({ slotKey: slotB });

    const r1 = await sandboxA.run({ script: createMicroverseScript('x = 42') });
    expect(r1._tag).toBe('ok');

    const r2 = await sandboxB.run({
      script: createMicroverseScript('assert(x ~= 42, "global leaked between slots")'),
    });
    expect(r2._tag).toBe('ok');

    await sandboxA.dispose();
    await sandboxB.dispose();
  });

  it('persists globals across sequential runs in the same slot', async () => {
    const adapter = new WasmoonRuntimeAdapter();
    const runtime = createStubMicroverseRuntime({
      adapter,
      logger: new ConsoleLogger(),
    });

    const slot = createMicroverseId('slot-persist-globals');
    const microverse = await runtime.createMicroverse({ slotKey: slot });

    const r1 = await microverse.run({
      script: createMicroverseScript(`
        function microverse_example_sum(a, b)
          return a + b
        end
      `),
    });
    expect(r1._tag).toBe('ok');

    const r2 = await microverse.run({
      script: createMicroverseScript(`
        assert(type(microverse_example_sum) == "function", "missing global from prior chunk")
        assert(microverse_example_sum(2, 3) == 5)
      `),
    });
    expect(r2._tag).toBe('ok');

    await microverse.dispose();
  });
});
