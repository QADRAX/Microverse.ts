import { createSandboxId, createSandboxScript, neverCancelledToken } from '@luarizer/runtime-core';
import { describe, expect, it, vi } from 'vitest';

const { createEngineMock } = vi.hoisted(() => {
  const createEngine = vi.fn(async () => ({
    doString: vi.fn(async () => {}),
    global: { close: vi.fn(async () => {}) },
  }));
  return { createEngineMock: createEngine };
});

vi.mock('wasmoon', () => ({
  LuaFactory: class {
    createEngine = createEngineMock;
  },
}));

describe('WasmoonRuntimeAdapter', () => {
  it('returns ok for successful execution', async () => {
    createEngineMock.mockClear();
    const { WasmoonRuntimeAdapter } = await import('./WasmoonRuntimeAdapter');
    const adapter = new WasmoonRuntimeAdapter();
    const result = await adapter.execute(
      { sandboxId: createSandboxId('s1'), cancellation: neverCancelledToken },
      createSandboxScript('return 1'),
    );
    expect(result._tag).toBe('ok');
  });

  it('reuses one engine across executes (shared VM)', async () => {
    createEngineMock.mockClear();
    const { WasmoonRuntimeAdapter } = await import('./WasmoonRuntimeAdapter');
    const adapter = new WasmoonRuntimeAdapter();
    await adapter.execute(
      { sandboxId: createSandboxId('a'), cancellation: neverCancelledToken },
      createSandboxScript('1'),
    );
    await adapter.execute(
      { sandboxId: createSandboxId('b'), cancellation: neverCancelledToken },
      createSandboxScript('2'),
    );
    expect(createEngineMock).toHaveBeenCalledTimes(1);
  });
});
