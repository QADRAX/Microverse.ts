import type { MicroverseScript } from '@microverse/runtime-core';

import type { LuaChunk } from './LuaChunk';

export function mapMicroverseScriptToLuaChunk(script: MicroverseScript): LuaChunk {
  return script as unknown as LuaChunk;
}
