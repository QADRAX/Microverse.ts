import { err, ok, type Result } from '@luarizer/shared';
import { LuaFactory } from 'wasmoon';

import type {
  ExecutionContext,
  ExecutionFailure,
  RuntimeAdapter,
  RunScriptResult,
  SandboxId,
  SandboxScript,
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
        const lua = await this.factory.createEngine();
        await lua.doString(LUARIZER_SLOT_VM_BOOTSTRAP_LUA);
        return lua;
      })();
    }
    return this.engineInit;
  };

  readonly execute = async (
    ctx: ExecutionContext,
    script: SandboxScript,
  ): Promise<Result<RunScriptResult, ExecutionFailure>> => {
    const lua = await this.getEngine();
    const slotLit = toLuaLongStringLiteral(String(ctx.sandboxId));
    const srcLit = toLuaLongStringLiteral(String(script));
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
