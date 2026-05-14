import type { LuaCompilePort } from '../../application/ports/LuaCompilePort';
import type { LuaChunk } from '../../domain/lua/LuaChunk';

export class PassthroughLuaCompiler implements LuaCompilePort {
  readonly validate = (chunk: LuaChunk): boolean => chunk.length > 0;
}
