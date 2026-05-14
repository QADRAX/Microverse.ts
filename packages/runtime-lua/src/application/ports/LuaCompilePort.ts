import type { LuaChunk } from '../../domain/lua/LuaChunk';

export type LuaCompilePort = {
  readonly validate: (chunk: LuaChunk) => boolean;
};
