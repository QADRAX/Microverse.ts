import { err, ok, type Result } from '@microverse.ts/shared';
import { LuaFactory } from 'wasmoon';

import type {
  ExecutionContext,
  ExecutionFailure,
  RuntimeAdapter,
  RunScriptInput,
  RunScriptResult,
  MicroverseId,
} from '@microverse.ts/runtime-core';

import {
  MICROVERSE_LUA_DEFAULT_INSTRUCTION_BUDGET,
  MICROVERSE_LUA_SLOT_VM_BOOTSTRAP,
} from './microverseLuaSlotVmBootstrap';
import { toLuaLongStringLiteral } from './luaLongString';
import {
  assertNotCancelled,
  assertScriptSize,
  MICROVERSE_LUA_DEFAULT_MAX_SCRIPT_CHARS,
  mapExecuteError,
  resolveTimeoutMs,
  runWithWallClockTimeout,
} from './wasmoonExecutePolicy';

type WasmoonLuaEngine = Awaited<ReturnType<LuaFactory['createEngine']>>;

export type WasmoonRuntimeAdapterOptions = {
  /** Rejects {@link RunScriptInput.script} larger than this (default {@link MICROVERSE_LUA_DEFAULT_MAX_SCRIPT_CHARS}). */
  readonly maxScriptChars?: number | undefined;
  /** Passed to `__microverse_lua_execute_in_slot` when the third argument is omitted (default {@link MICROVERSE_LUA_DEFAULT_INSTRUCTION_BUDGET}). */
  readonly defaultInstructionBudget?: number | undefined;
};

export class WasmoonRuntimeAdapter implements RuntimeAdapter {
  private readonly factory = new LuaFactory();

  private readonly maxScriptChars: number;

  private readonly defaultInstructionBudget: number;

  private engineInit: Promise<WasmoonLuaEngine> | undefined;

  constructor(private readonly options: WasmoonRuntimeAdapterOptions = {}) {
    this.maxScriptChars = options.maxScriptChars ?? MICROVERSE_LUA_DEFAULT_MAX_SCRIPT_CHARS;
    this.defaultInstructionBudget =
      options.defaultInstructionBudget ?? MICROVERSE_LUA_DEFAULT_INSTRUCTION_BUDGET;
  }

  private getEngine = (): Promise<WasmoonLuaEngine> => {
    if (this.engineInit === undefined) {
      this.engineInit = (async () => {
        const lua = await this.factory.createEngine({ injectObjects: true });
        await lua.doString(MICROVERSE_LUA_SLOT_VM_BOOTSTRAP);
        return lua;
      })();
    }
    return this.engineInit;
  };

  private resetEngine = async (): Promise<void> => {
    const current = this.engineInit;
    this.engineInit = undefined;
    if (current === undefined) {
      return;
    }
    const lua = await current.catch(() => undefined);
    if (lua !== undefined) {
      try {
        await Promise.resolve(lua.global.close());
      } catch {
        // ignore
      }
    }
  };

  private runLua = async (lua: WasmoonLuaEngine, chunk: string): Promise<void> => {
    await lua.doString(chunk);
  };

  readonly execute = async (
    ctx: ExecutionContext,
    input: RunScriptInput,
  ): Promise<Result<RunScriptResult, ExecutionFailure>> => {
    try {
      assertNotCancelled(ctx.cancellation);
      assertScriptSize(String(input.script), this.maxScriptChars);
    } catch (e) {
      return err(mapExecuteError(e));
    }

    const timeoutMs = resolveTimeoutMs(input.timeout);
    const budget = this.defaultInstructionBudget;

    const runOnce = async (): Promise<Result<RunScriptResult, ExecutionFailure>> => {
      const lua = await this.getEngine();
      const slotLit = toLuaLongStringLiteral(String(ctx.microverseId));
      const merge = input.mergeEnv;
      if (merge !== undefined && Object.keys(merge).length > 0) {
        for (const name of Object.keys(merge)) {
          if (!Object.prototype.hasOwnProperty.call(merge, name)) {
            continue;
          }
          const tmp = `__microverse_lua_one_${randomMicroverseToken()}`;
          lua.global.set(tmp, merge[name]);
          const nameLit = toLuaLongStringLiteral(name);
          const tmpLit = toLuaLongStringLiteral(tmp);
          const putChunk = `__microverse_lua_put_bridge_from_global(${slotLit}, ${nameLit}, ${tmpLit})`;
          const putOutcome = await runWithWallClockTimeout(() => this.runLua(lua, putChunk), timeoutMs);
          if (putOutcome === 'timeout') {
            await this.resetEngine();
            return err({ _tag: 'Timeout' });
          }
        }
      }
      const srcLit = toLuaLongStringLiteral(String(input.script));
      const execChunk = `__microverse_lua_execute_in_slot(${slotLit}, ${srcLit}, ${budget})`;
      const execOutcome = await runWithWallClockTimeout(() => this.runLua(lua, execChunk), timeoutMs);
      if (execOutcome === 'timeout') {
        await this.resetEngine();
        return err({ _tag: 'Timeout' });
      }
      return ok({ output: 'lua_ok' });
    };

    try {
      return await runOnce();
    } catch (e) {
      const mapped = mapExecuteError(e);
      if (mapped._tag === 'AdapterError' && mapped.message.includes('instruction limit exceeded')) {
        await this.resetEngine();
      }
      return err(mapped);
    }
  };

  readonly disposeMicroverse = async (microverseId: MicroverseId): Promise<void> => {
    if (this.engineInit === undefined) {
      return;
    }
    const lua = await this.engineInit.catch(() => undefined);
    if (lua === undefined) {
      return;
    }
    const slotLit = toLuaLongStringLiteral(String(microverseId));
    try {
      await lua.doString(`__microverse_lua_destroy_slot(${slotLit})`);
    } catch {
      // ignore
    }
  };

}

function randomMicroverseToken(): string {
  const g = globalThis as typeof globalThis & { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) {
    return g.crypto.randomUUID();
  }
  return Math.random().toString(16).slice(2);
}
