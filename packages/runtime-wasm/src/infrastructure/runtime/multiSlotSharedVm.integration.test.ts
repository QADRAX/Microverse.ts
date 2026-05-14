import {
  ConsoleLogger,
  createSandboxId,
  createSandboxScript,
  createStubSandboxRuntime,
} from '@luarizer/runtime-core';
import { describe, expect, it } from 'vitest';

import { WasmoonRuntimeAdapter } from './WasmoonRuntimeAdapter';

describe('Wasmoon multi-slot shared VM', () => {
  it('isolates globals per slot in one LuaEngine', async () => {
    const adapter = new WasmoonRuntimeAdapter();
    const runtime = createStubSandboxRuntime({
      adapter,
      logger: new ConsoleLogger(),
    });

    const slotA = createSandboxId('slot-a');
    const slotB = createSandboxId('slot-b');
    const sandboxA = await runtime.createSandbox({ slotKey: slotA });
    const sandboxB = await runtime.createSandbox({ slotKey: slotB });

    const r1 = await sandboxA.run({ script: createSandboxScript('x = 42') });
    expect(r1._tag).toBe('ok');

    const r2 = await sandboxB.run({
      script: createSandboxScript('assert(x ~= 42, "global leaked between slots")'),
    });
    expect(r2._tag).toBe('ok');

    await sandboxA.dispose();
    await sandboxB.dispose();
  });
});
