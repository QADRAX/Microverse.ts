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

import { LUARIZER_SLOT_VM_BOOTSTRAP_LUA } from './luarizerSlotVmBootstrapLua';
import { toLuaLongStringLiteral } from './luaLongString';

type WasmoonLuaEngine = Awaited<ReturnType<LuaFactory['createEngine']>>;

export class WasmoonRuntimeAdapter implements RuntimeAdapter {
  private readonly factory = new LuaFactory();

  private engineInit: Promise<WasmoonLuaEngine> | undefined;

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

  readonly execute = async (
    ctx: ExecutionContext,
    input: RunScriptInput,
  ): Promise<Result<RunScriptResult, ExecutionFailure>> => {
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
        await lua.doString(
          `__luarizer_put_bridge_from_global(${slotLit}, ${nameLit}, ${tmpLit})`,
        );
      }
    }
    const srcLit = toLuaLongStringLiteral(String(input.script));
    const chunk = `__luarizer_execute_in_slot(${slotLit}, ${srcLit})`;
    try {
      await lua.doString(chunk);
      return ok({ output: 'lua_ok' });
    } catch (e) {
      return err({
        _tag: 'AdapterError',
        message: e instanceof Error ? e.message : String(e),
      });
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
