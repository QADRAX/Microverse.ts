import {
  createSandboxId,
  createSandboxScript,
  fixedTimeout,
  neverCancelledToken,
} from '@luarizer/runtime-core';
import { describe, expect, it, vi } from 'vitest';

const { createEngineMock, doStringMock } = vi.hoisted(() => {
  const doString = vi.fn(async () => {});
  const createEngine = vi.fn(async () => ({
    doString,
    global: { close: vi.fn(async () => {}), set: vi.fn() },
  }));
  return { createEngineMock: createEngine, doStringMock: doString };
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
      { script: createSandboxScript('return 1') },
    );
    expect(result._tag).toBe('ok');
  });

  it('reuses one engine across executes (shared VM)', async () => {
    createEngineMock.mockClear();
    const { WasmoonRuntimeAdapter } = await import('./WasmoonRuntimeAdapter');
    const adapter = new WasmoonRuntimeAdapter();
    await adapter.execute(
      { sandboxId: createSandboxId('a'), cancellation: neverCancelledToken },
      { script: createSandboxScript('1') },
    );
    await adapter.execute(
      { sandboxId: createSandboxId('b'), cancellation: neverCancelledToken },
      { script: createSandboxScript('2') },
    );
    expect(createEngineMock).toHaveBeenCalledTimes(1);
  });

  it('returns Timeout when wall-clock budget is exceeded', async () => {
    createEngineMock.mockClear();
    doStringMock.mockImplementation(async (chunk: string) => {
      if (chunk.includes('do\n  local REAL_G')) {
        return;
      }
      if (chunk.includes('__luarizer_execute_in_slot')) {
        return new Promise<void>(() => {
          /* never resolves — wall-clock race should win */
        });
      }
    });
    const { WasmoonRuntimeAdapter } = await import('./WasmoonRuntimeAdapter');
    const adapter = new WasmoonRuntimeAdapter();
    const result = await adapter.execute(
      { sandboxId: createSandboxId('timeout'), cancellation: neverCancelledToken },
      { script: createSandboxScript(''), timeout: fixedTimeout(25) },
    );
    expect(result._tag).toBe('err');
    if (result._tag === 'err') {
      expect(result.error._tag).toBe('Timeout');
    }
    doStringMock.mockImplementation(async () => {});
  });
});
