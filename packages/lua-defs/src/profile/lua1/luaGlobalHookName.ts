export type LuaGlobalHookName<Kind extends string> = `on${Kind}`;

export function luaGlobalHookName<const Kind extends string>(kind: Kind): LuaGlobalHookName<Kind> {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(kind)) {
    throw new Error(`unsafe Lua identifier for event kind: ${kind}`);
  }
  return `on${kind}` as LuaGlobalHookName<Kind>;
}
