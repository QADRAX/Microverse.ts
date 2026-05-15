import { err, ok, type Result } from '@luarizer/shared';
import { LuaFactory } from 'wasmoon';

import type {
  ExecutionContext,
  ExecutionFailure,
  RuntimeAdapter,
  RunScriptInput,
  RunScriptResult,
  SandboxId,
} from '@luarizer/runtime-core';

import {
  LUARIZER_DEFAULT_INSTRUCTION_BUDGET,
  LUARIZER_SLOT_VM_BOOTSTRAP_LUA,
} from './luarizerSlotVmBootstrapLua';
import { toLuaLongStringLiteral } from './luaLongString';
import {
  assertNotCancelled,
  assertScriptSize,
  LUARIZER_DEFAULT_MAX_SCRIPT_CHARS,
  mapExecuteError,
  resolveTimeoutMs,
  runWithWallClockTimeout,
} from './wasmoonExecutePolicy';

type WasmoonLuaEngine = Awaited<ReturnType<LuaFactory['createEngine']>>;

export type WasmoonRuntimeAdapterOptions = {
  /** Rejects {@link RunScriptInput.script} larger than this (default {@link LUARIZER_DEFAULT_MAX_SCRIPT_CHARS}). */
  readonly maxScriptChars?: number | undefined;
  /** Passed to `__luarizer_execute_in_slot` when the third argument is omitted (default {@link LUARIZER_DEFAULT_INSTRUCTION_BUDGET}). */
  readonly defaultInstructionBudget?: number | undefined;
};

export class WasmoonRuntimeAdapter implements RuntimeAdapter {
  private readonly factory = new LuaFactory();

  private readonly maxScriptChars: number;

  private readonly defaultInstructionBudget: number;

  private engineInit: Promise<WasmoonLuaEngine> | undefined;

  constructor(private readonly options: WasmoonRuntimeAdapterOptions = {}) {
    this.maxScriptChars = options.maxScriptChars ?? LUARIZER_DEFAULT_MAX_SCRIPT_CHARS;
    this.defaultInstructionBudget =
      options.defaultInstructionBudget ?? LUARIZER_DEFAULT_INSTRUCTION_BUDGET;
  }

  private getEngine = (): Promise<WasmoonLuaEngine> => {
    if (this.engineInit === undefined) {
      this.engineInit = (async () => {
        const lua = await this.factory.createEngine({ injectObjects: true });
        await lua.doString(LUARIZER_SLOT_VM_BOOTSTRAP_LUA);
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
        await lua.global.close();
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
      const slotLit = toLuaLongStringLiteral(String(ctx.sandboxId));
      const merge = input.mergeEnv;
      if (merge !== undefined && Object.keys(merge).length > 0) {
        for (const name of Object.keys(merge)) {
          if (!Object.prototype.hasOwnProperty.call(merge, name)) {
            continue;
          }
          const tmp = `__luarizer_one_${randomLuarizerToken()}`;
          lua.global.set(tmp, merge[name]);
          const nameLit = toLuaLongStringLiteral(name);
          const tmpLit = toLuaLongStringLiteral(tmp);
          const putChunk = `__luarizer_put_bridge_from_global(${slotLit}, ${nameLit}, ${tmpLit})`;
          const putOutcome = await runWithWallClockTimeout(() => this.runLua(lua, putChunk), timeoutMs);
          if (putOutcome === 'timeout') {
            await this.resetEngine();
            return err({ _tag: 'Timeout' });
          }
        }
      }
      const srcLit = toLuaLongStringLiteral(String(input.script));
      const execChunk = `__luarizer_execute_in_slot(${slotLit}, ${srcLit}, ${budget})`;
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

  readonly disposeSandbox = async (sandboxId: SandboxId): Promise<void> => {
    if (this.engineInit === undefined) {
      return;
    }
    const lua = await this.engineInit.catch(() => undefined);
    if (lua === undefined) {
      return;
    }
    const slotLit = toLuaLongStringLiteral(String(sandboxId));
    try {
      await lua.doString(`__luarizer_destroy_slot(${slotLit})`);
    } catch {
      // ignore
    }
  };
}

function randomLuarizerToken(): string {
  const g = globalThis as typeof globalThis & { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) {
    return g.crypto.randomUUID();
  }
  return Math.random().toString(16).slice(2);
}
