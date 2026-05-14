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
});
