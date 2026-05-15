import {
  ConsoleLogger,
  createSandboxId,
  createSandboxScript,
  createStubSandboxRuntime,
} from '@luarizer/runtime-core';
import { describe, expect, it } from 'vitest';

import { WasmoonRuntimeAdapter } from './WasmoonRuntimeAdapter';

function createRuntime() {
  return createStubSandboxRuntime({
    adapter: new WasmoonRuntimeAdapter(),
    logger: new ConsoleLogger(),
  });
}

describe('explicit async bridges (integration)', () => {
  it('sync bridge returns value directly without :await()', async () => {
    const runtime = createRuntime();
    const slot = createSandboxId('explicit-sync-bridge');
    const sandbox = await runtime.createSandbox({ slotKey: slot });

    const r = await sandbox.run({
      mergeEnv: {
        Data: {
          load: (id: string) => `row:${id}`,
        },
      },
      script: createSandboxScript(`
        local row = Data.load("7")
        assert(row == "row:7", row)
        assert(type(row) == "string")
      `),
    });
    expect(r._tag).toBe('ok');
    await sandbox.dispose();
  });

  it('async bridge without :await() returns a handle, not the resolved value', async () => {
    const runtime = createRuntime();
    const slot = createSandboxId('explicit-async-handle');
    const sandbox = await runtime.createSandbox({ slotKey: slot });

    const r = await sandbox.run({
      mergeEnv: {
        Data: {
          load: async (id: string) => {
            await new Promise((resolve) => setTimeout(resolve, 5));
            return `row:${id}`;
          },
        },
      },
      script: createSandboxScript(`
        local h = Data.load("9")
        assert(type(h) == "table" or type(h) == "userdata", type(h))
        assert(type(h.await) == "function")
      `),
    });
    expect(r._tag).toBe('ok');
    await sandbox.dispose();
  });

  it('async bridge resolves via handle:await()', async () => {
    const runtime = createRuntime();
    const slot = createSandboxId('explicit-async-await');
    const sandbox = await runtime.createSandbox({ slotKey: slot });

    const r = await sandbox.run({
      mergeEnv: {
        Data: {
          load: async (id: string) => {
            await new Promise((resolve) => setTimeout(resolve, 5));
            return `row:${id}`;
          },
        },
      },
      script: createSandboxScript(`
        local row = Data.load("99"):await()
        assert(row == "row:99", row)
      `),
    });
    expect(r._tag).toBe('ok');
    await sandbox.dispose();
  });

  it('optional onComplete runs after following statements in the same chunk', async () => {
    const runtime = createRuntime();
    const slot = createSandboxId('explicit-async-callback');
    const sandbox = await runtime.createSandbox({ slotKey: slot });

    const r = await sandbox.run({
      mergeEnv: {
        Data: {
          load: async (id: string) => {
            await new Promise((resolve) => setTimeout(resolve, 5));
            return `row:${id}`;
          },
        },
      },
      script: createSandboxScript(`
        __async_cb_order = ""
        Data.load("cb", function(row)
          __async_cb_order = __async_cb_order .. "c:" .. tostring(row)
        end)
        __async_cb_order = __async_cb_order .. "a"
      `),
    });
    expect(r._tag).toBe('ok');
    const r2 = await sandbox.run({
      script: createSandboxScript(`
        assert(__async_cb_order == "ac:row:cb", __async_cb_order)
      `),
    });
    expect(r2._tag).toBe('ok');
    await sandbox.dispose();
  });
});
