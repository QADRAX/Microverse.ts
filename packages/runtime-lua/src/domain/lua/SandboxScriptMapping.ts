import type { SandboxScript } from '@luarizer/runtime-core';

import type { LuaChunk } from './LuaChunk';

export function mapSandboxScriptToLuaChunk(script: SandboxScript): LuaChunk {
  return script as unknown as LuaChunk;
}
