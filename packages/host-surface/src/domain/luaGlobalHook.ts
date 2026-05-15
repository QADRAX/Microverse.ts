/**
 * Lua convention for domain hooks: PascalCase event kind → global `on{Kind}` (e.g. `OrderPlaced` → `onOrderPlaced`).
 */
export type LuaGlobalHookName<Kind extends string> = `on${Kind}`;

/**
 * Builds the global Lua function name for a PascalCase event `kind` (e.g. `InventoryLow` → `onInventoryLow`).
 * Throws if `kind` is not a safe Lua identifier fragment.
 */
export function luaGlobalHookName<const Kind extends string>(kind: Kind): LuaGlobalHookName<Kind> {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(kind)) {
    throw new Error(`unsafe Lua identifier for event kind: ${kind}`);
  }
  const name = `on${kind}`;
  return name as LuaGlobalHookName<Kind>;
}
