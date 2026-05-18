/** Lua / LuaCATS type atoms: never emit `---@alias` for these names from `lua.paramTypes` / `lua.returns` tokens. */
export const LUA_TYPE_ATOMS = new Set([
  'any',
  'boolean',
  'false',
  'integer',
  'nil',
  'never',
  'number',
  'self',
  'string',
  'table',
  'true',
  'unknown',
]);

export function isLuaTypeAtom(name: string): boolean {
  return LUA_TYPE_ATOMS.has(name);
}
