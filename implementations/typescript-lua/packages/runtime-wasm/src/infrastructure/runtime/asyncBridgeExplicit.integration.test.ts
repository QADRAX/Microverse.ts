import {
  ConsoleLogger,
  createMicroverseId,
  createMicroverseScript,
  createStubMicroverseRuntime,
} from '@microverse.ts/runtime-core';
import { describe, expect, it } from 'vitest';

import { WasmoonRuntimeAdapter } from './WasmoonRuntimeAdapter';

function createRuntime() {
  return createStubMicroverseRuntime({
    adapter: new WasmoonRuntimeAdapter(),
    logger: new ConsoleLogger(),
  });
}

describe('explicit async bridges (integration)', () => {
  it('sync bridge returns value directly without :await()', async () => {
    const runtime = createRuntime();
    const slot = createMicroverseId('explicit-sync-bridge');
    const microverse = await runtime.createMicroverse({ slotKey: slot });

    const r = await microverse.run({
      mergeEnv: {
        Data: {
          load: (id: string) => `row:${id}`,
        },
      },
      script: createMicroverseScript(`
        local row = Data.load("7")
        assert(row == "row:7", row)
        assert(type(row) == "string")
      `),
    });
    expect(r._tag).toBe('ok');
    await microverse.dispose();
  });

  it('async bridge without :await() returns a handle, not the resolved value', async () => {
    const runtime = createRuntime();
    const slot = createMicroverseId('explicit-async-handle');
    const microverse = await runtime.createMicroverse({ slotKey: slot });

    const r = await microverse.run({
      mergeEnv: {
        Data: {
          load: async (id: string) => {
            await new Promise((resolve) => setTimeout(resolve, 5));
            return `row:${id}`;
          },
        },
      },
      script: createMicroverseScript(`
        local h = Data.load("9")
        assert(type(h) == "table" or type(h) == "userdata", type(h))
        assert(type(h.await) == "function")
      `),
    });
    expect(r._tag).toBe('ok');
    await microverse.dispose();
  });

  it('async bridge resolves via handle:await()', async () => {
    const runtime = createRuntime();
    const slot = createMicroverseId('explicit-async-await');
    const microverse = await runtime.createMicroverse({ slotKey: slot });

    const r = await microverse.run({
      mergeEnv: {
        Data: {
          load: async (id: string) => {
            await new Promise((resolve) => setTimeout(resolve, 5));
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

  it('optional onComplete runs after following statements in the same chunk', async () => {
    const runtime = createRuntime();
    const slot = createMicroverseId('explicit-async-callback');
    const microverse = await runtime.createMicroverse({ slotKey: slot });

    const r = await microverse.run({
      mergeEnv: {
        Data: {
          load: async (id: string) => {
            await new Promise((resolve) => setTimeout(resolve, 5));
            return `row:${id}`;
          },
        },
      },
      script: createMicroverseScript(`
        __async_cb_order = ""
        Data.load("cb", function(row)
          __async_cb_order = __async_cb_order .. "c:" .. tostring(row)
        end)
        __async_cb_order = __async_cb_order .. "a"
      `),
    });
    expect(r._tag).toBe('ok');
    const r2 = await microverse.run({
      script: createMicroverseScript(`
        assert(__async_cb_order == "ac:row:cb", __async_cb_order)
      `),
    });
    expect(r2._tag).toBe('ok');
    await microverse.dispose();
  });
});
