import {
  ConsoleLogger,
  createMicroverseId,
  createMicroverseScript,
  createStubMicroverseRuntime,
} from '@microverse.ts/runtime-core';
import { describe, expect, it, vi } from 'vitest';

import { WasmoonRuntimeAdapter } from './WasmoonRuntimeAdapter';

function createSecurityRuntime(instructionBudget?: number) {
  return createStubMicroverseRuntime({
    adapter: new WasmoonRuntimeAdapter({
      defaultInstructionBudget: instructionBudget,
    }),
    logger: new ConsoleLogger(),
  });
}

describe('Lua sandbox security (integration)', () => {
  it('slot env does not expose load, debug, io, or os', async () => {
    const runtime = createSecurityRuntime();
    const slot = createMicroverseId('sec-no-dangerous-libs');
    const microverse = await runtime.createMicroverse({ slotKey: slot });

    const r = await microverse.run({
      script: createMicroverseScript(`
        assert(type(load) == "nil", "load must be nil")
        assert(type(debug) == "nil", "debug must be nil")
        assert(type(io) == "nil", "io must be nil")
        assert(type(os) == "nil", "os must be nil")
        assert(type(require) == "nil", "require must be nil")
      `),
    });
    expect(r._tag).toBe('ok');

    await microverse.dispose();
  });

  it('slot env cannot read __microverse_lua_envs from a safe global', async () => {
    const runtime = createSecurityRuntime();
    const slot = createMicroverseId('sec-no-internal-envs');
    const microverse = await runtime.createMicroverse({ slotKey: slot });

    const r = await microverse.run({
      script: createMicroverseScript(`
        assert(type(__microverse_lua_envs) == "nil", "internal env registry must not be visible")
        assert(type(__microverse_lua_execute_in_slot) == "nil", "internal executor must not be visible")
      `),
    });
    expect(r._tag).toBe('ok');

    await microverse.dispose();
  });

  it('rejects assignment on bridge proxy tables', async () => {
    const runtime = createSecurityRuntime();
    const slot = createMicroverseId('sec-bridge-readonly');
    const microverse = await runtime.createMicroverse({ slotKey: slot });
    const calls = vi.fn(() => 'ok');

    const r = await microverse.run({
      mergeEnv: { Data: { load: calls } },
      script: createMicroverseScript(`
        Data.load = function() return "hijacked" end
      `),
    });
    expect(r._tag).toBe('err');
    if (r._tag === 'err' && r.error._tag === 'AdapterError') {
      expect(r.error.message).toMatch(/read-only/);
    }
    expect(calls).not.toHaveBeenCalled();

    await microverse.dispose();
  });

  it('rawset shadow on a bridge does not call the host implementation', async () => {
    const runtime = createSecurityRuntime();
    const slot = createMicroverseId('sec-rawset-shadow');
    const microverse = await runtime.createMicroverse({ slotKey: slot });
    const calls = vi.fn(() => 'row:1');

    const r = await microverse.run({
      mergeEnv: { Data: { load: calls } },
      script: createMicroverseScript(`
        local shadow = function() return "shadow" end
        rawset(Data, "load", shadow)
        assert(Data.load("x") == "shadow")
      `),
    });
    expect(r._tag).toBe('ok');
    expect(calls).not.toHaveBeenCalled();

    await microverse.dispose();
  });

  it('re-installing mergeEnv restores bridges after rawset shadow', async () => {
    const runtime = createSecurityRuntime();
    const slot = createMicroverseId('sec-mergeenv-refresh');
    const microverse = await runtime.createMicroverse({ slotKey: slot });
    const calls = vi.fn((id: string) => `row:${id}`);
    const bridge = { Data: { load: calls } };

    const r1 = await microverse.run({
      mergeEnv: bridge,
      script: createMicroverseScript(`rawset(Data, "load", function() return "shadow" end)`),
    });
    expect(r1._tag).toBe('ok');

    const r2 = await microverse.run({
      mergeEnv: bridge,
      script: createMicroverseScript(`assert(Data.load("9") == "row:9")`),
    });
    expect(r2._tag).toBe('ok');
    expect(calls).toHaveBeenCalledWith('9');

    await microverse.dispose();
  });

  it('aborts tight infinite loops via instruction budget', async () => {
    const runtime = createSecurityRuntime(20_000);
    const slot = createMicroverseId('sec-instruction-limit');
    const microverse = await runtime.createMicroverse({ slotKey: slot });

    const r = await microverse.run({
      script: createMicroverseScript(`
        while true do end
      `),
    });
    expect(r._tag).toBe('err');
    if (r._tag === 'err') {
      expect(r.error._tag).toBe('AdapterError');
      if (r.error._tag === 'AdapterError') {
        expect(r.error.message).toMatch(/instruction limit exceeded/);
      }
    }

    await microverse.dispose();
  });

  it('rejects scripts larger than maxScriptChars', async () => {
    const adapter = new WasmoonRuntimeAdapter({ maxScriptChars: 16 });
    const runtime = createStubMicroverseRuntime({
      adapter,
      logger: new ConsoleLogger(),
    });
    const microverse = await runtime.createMicroverse({ slotKey: createMicroverseId('sec-size') });

    const r = await microverse.run({
      script: createMicroverseScript('x = ' + '"a"'.repeat(20)),
    });
    expect(r._tag).toBe('err');
    if (r._tag === 'err' && r.error._tag === 'AdapterError') {
      expect(r.error.message).toMatch(/script exceeds max size/);
    }

    await microverse.dispose();
  });

});
