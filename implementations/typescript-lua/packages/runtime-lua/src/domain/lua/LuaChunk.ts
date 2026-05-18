export type LuaChunk = string & { readonly __brand: 'LuaChunk' };

export function createLuaChunk(source: string): LuaChunk {
  return source as LuaChunk;
}
