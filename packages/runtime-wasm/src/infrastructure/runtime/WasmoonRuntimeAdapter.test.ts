import { createSandboxId, createSandboxScript, neverCancelledToken } from '@luarizer/runtime-core';
import { describe, expect, it, vi } from 'vitest';

vi.mock('wasmoon', () => ({
  LuaFactory: class {
    createEngine = async () => ({
      doString: async () => {},
      global: { close: async () => {} },
    });
  },
}));

describe('WasmoonRuntimeAdapter', () => {
  it('returns ok for successful execution', async () => {
    const { WasmoonRuntimeAdapter } = await import('./WasmoonRuntimeAdapter');
    const adapter = new WasmoonRuntimeAdapter();
    const result = await adapter.execute(
      { sandboxId: createSandboxId('s1'), cancellation: neverCancelledToken },
      createSandboxScript('return 1'),
    );
    expect(result._tag).toBe('ok');
  });
});
