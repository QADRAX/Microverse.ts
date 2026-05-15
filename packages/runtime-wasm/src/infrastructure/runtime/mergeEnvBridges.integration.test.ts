import {
  ConsoleLogger,
  createSandboxId,
  createSandboxScript,
  createStubSandboxRuntime,
} from '@luarizer/runtime-core';
import { describe, expect, it } from 'vitest';

import { WasmoonRuntimeAdapter } from './WasmoonRuntimeAdapter';

describe('Wasmoon mergeEnv (bridges into slot _ENV)', () => {
  it('lets Lua call a JS-backed global installed via mergeEnv', async () => {
    const adapter = new WasmoonRuntimeAdapter();
    const runtime = createStubSandboxRuntime({
      adapter,
      logger: new ConsoleLogger(),
    });

    const slot = createSandboxId('slot-with-data-bridge');
    const sandbox = await runtime.createSandbox({ slotKey: slot });

    const r1 = await sandbox.run({
      mergeEnv: {
        Data: {
          load: (id: string) => `row:${id}`,
        },
      },
      script: createSandboxScript(`
        local row = Data.load("42")
        assert(row == "row:42", row)
        return row
      `),
    });
    expect(r1._tag).toBe('ok');

    const r2 = await sandbox.run({
      script: createSandboxScript('return Data.load("7")'),
    });
    expect(r2._tag).toBe('ok');

    await sandbox.dispose();
  });

  it('keeps Lua globals from a prior run when mergeEnv is applied again', async () => {
    const adapter = new WasmoonRuntimeAdapter();
    const runtime = createStubSandboxRuntime({
      adapter,
      logger: new ConsoleLogger(),
    });

    const slot = createSandboxId('slot-merge-persist');
    const sandbox = await runtime.createSandbox({ slotKey: slot });
    const bridge = {
      Data: {
        load: (id: string) => `row:${id}`,
      },
    };

    const r1 = await sandbox.run({
      mergeEnv: bridge,
      script: createSandboxScript(`
        function luarizer_example_sum(a, b)
          return a + b
        end
        assert(Data.load("1") == "row:1")
      `),
    });
    expect(r1._tag).toBe('ok');

    const r2 = await sandbox.run({
      mergeEnv: bridge,
      script: createSandboxScript(`
        assert(type(luarizer_example_sum) == "function")
        assert(luarizer_example_sum(2, 3) == 5)
      `),
    });
    expect(r2._tag).toBe('ok');

    await sandbox.dispose();
  });

  it('slot bootstrap auto-awaits Promise returned from a mergeEnv bridge method', async () => {
    const adapter = new WasmoonRuntimeAdapter();
    const runtime = createStubSandboxRuntime({
      adapter,
      logger: new ConsoleLogger(),
    });

    const slot = createSandboxId('slot-async-bridge');
    const sandbox = await runtime.createSandbox({ slotKey: slot });

    const r = await sandbox.run({
      mergeEnv: {
        Data: {
          load: async (id: string) => {
            await new Promise((r2) => setTimeout(r2, 5));
            return `row:${id}`;
          },
        },
      },
      script: createSandboxScript(`
        local row = Data.load("99")
        assert(row == "row:99", row)
      `),
    });
    expect(r._tag).toBe('ok');

    await sandbox.dispose();
  });
});
