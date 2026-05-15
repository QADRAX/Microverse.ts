import {
  ConsoleLogger,
  createMicroverseId,
  createMicroverseScript,
  createStubMicroverseRuntime,
} from '@microverse/runtime-core';
import { describe, expect, it } from 'vitest';

import { WasmoonRuntimeAdapter } from './WasmoonRuntimeAdapter';

describe('Wasmoon mergeEnv (bridges into slot _ENV)', () => {
  it('lets Lua call a JS-backed global installed via mergeEnv', async () => {
    const adapter = new WasmoonRuntimeAdapter();
    const runtime = createStubMicroverseRuntime({
      adapter,
      logger: new ConsoleLogger(),
    });

    const slot = createMicroverseId('slot-with-data-bridge');
    const microverse = await runtime.createMicroverse({ slotKey: slot });

    const r1 = await microverse.run({
      mergeEnv: {
        Data: {
          load: (id: string) => `row:${id}`,
        },
      },
      script: createMicroverseScript(`
        local row = Data.load("42")
        assert(row == "row:42", row)
        return row
      `),
    });
    expect(r1._tag).toBe('ok');

    const r2 = await microverse.run({
      script: createMicroverseScript('return Data.load("7")'),
    });
    expect(r2._tag).toBe('ok');

    await microverse.dispose();
  });

  it('keeps Lua globals from a prior run when mergeEnv is applied again', async () => {
    const adapter = new WasmoonRuntimeAdapter();
    const runtime = createStubMicroverseRuntime({
      adapter,
      logger: new ConsoleLogger(),
    });

    const slot = createMicroverseId('slot-merge-persist');
    const microverse = await runtime.createMicroverse({ slotKey: slot });
    const bridge = {
      Data: {
        load: (id: string) => `row:${id}`,
      },
    };

    const r1 = await microverse.run({
      mergeEnv: bridge,
      script: createMicroverseScript(`
        function microverse_example_sum(a, b)
          return a + b
        end
        assert(Data.load("1") == "row:1")
      `),
    });
    expect(r1._tag).toBe('ok');

    const r2 = await microverse.run({
      mergeEnv: bridge,
      script: createMicroverseScript(`
        assert(type(microverse_example_sum) == "function")
        assert(microverse_example_sum(2, 3) == 5)
      `),
    });
    expect(r2._tag).toBe('ok');

    await microverse.dispose();
  });

  it('slot bootstrap requires explicit :await() for Promise returned from a mergeEnv bridge method', async () => {
    const adapter = new WasmoonRuntimeAdapter();
    const runtime = createStubMicroverseRuntime({
      adapter,
      logger: new ConsoleLogger(),
    });

    const slot = createMicroverseId('slot-async-bridge');
    const microverse = await runtime.createMicroverse({ slotKey: slot });

    const r = await microverse.run({
      mergeEnv: {
        Data: {
          load: async (id: string) => {
            await new Promise((r2) => setTimeout(r2, 5));
            return `row:${id}`;
          },
        },
      },
      script: createMicroverseScript(`
        local row = Data.load("99"):await()
        assert(row == "row:99", row)
      `),
    });
    expect(r._tag).toBe('ok');

    await microverse.dispose();
  });
});
