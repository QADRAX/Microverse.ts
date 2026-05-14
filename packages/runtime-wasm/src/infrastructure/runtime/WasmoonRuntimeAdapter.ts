import { err, ok, type Result } from '@luarizer/shared';
import { mapSandboxScriptToLuaChunk } from '@luarizer/runtime-lua';
import { LuaFactory } from 'wasmoon';

import type {
  ExecutionContext,
  ExecutionFailure,
  RuntimeAdapter,
  RunScriptResult,
  SandboxScript,
} from '@luarizer/runtime-core';

export class WasmoonRuntimeAdapter implements RuntimeAdapter {
  private readonly factory = new LuaFactory();

  readonly execute = async (
    _ctx: ExecutionContext,
    script: SandboxScript,
  ): Promise<Result<RunScriptResult, ExecutionFailure>> => {
    const lua = await this.factory.createEngine();
    try {
      await lua.doString(String(mapSandboxScriptToLuaChunk(script)));
      return ok({ output: 'lua_ok' });
    } catch (e) {
      return err({
        _tag: 'AdapterError',
        message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      try {
        await lua.global.close();
      } catch {
        // ignore
      }
    }
  };
}
