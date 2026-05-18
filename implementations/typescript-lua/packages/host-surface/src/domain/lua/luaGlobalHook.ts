/**
 * Lua convention for domain hooks: PascalCase event kind → method name `on{Kind}` on the workflow
 * component table from `component:extend()` in each Lua slot (e.g. `OrderPlaced` → `onOrderPlaced`).
 */
export type LuaGlobalHookName<Kind extends string> = `on${Kind}`;

/**
 * Builds the `on{Kind}` method name dispatched on the slot’s workflow handler for a PascalCase event `kind`
 * (e.g. `InventoryLow` → `onInventoryLow`).
 * Throws if `kind` is not a safe Lua identifier fragment.
 */
export function luaGlobalHookName<const Kind extends string>(kind: Kind): LuaGlobalHookName<Kind> {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(kind)) {
    throw new Error(`unsafe Lua identifier for event kind: ${kind}`);
  }
  const name = `on${kind}`;
  return name as LuaGlobalHookName<Kind>;
}
