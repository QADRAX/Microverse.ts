# Business scripting engine (example)

End-to-end sample: an in-memory e-commerce **rules engine** where TypeScript owns domain services and Lua **components** react to events through a typed host surface.

**Full integration guide:** [`packages/microverse-lua/README.md#integrating-in-your-app`](../../packages/microverse-lua/README.md#integrating-in-your-app).

## What it demonstrates

- **Host surface** — bridges (`orders`, `billing`, `audit`, …) with Zod + capabilities.
- **Component hooks** — `OrderPlaced`, `InventoryLow`, `JobDone` → Lua `on*` methods.
- **Multiple script instances** — different capability allowlists and props per mount.
- **LuaCATS** — generated `businessSurface.d.lua` for LuaLS in `lua/components/`.

## Layout

| Path | Role |
|------|------|
| `src/businessSurface.ts` | Default-exported surface for runtime + `generate-lua-defs`. |
| `src/BusinessScriptingEngine.ts` | Thin wrapper around `MicroverseLua.create`. |
| `src/services/` | Mock host services (`orders`, `billing`, …). |
| `src/schemas/` | Zod payloads, `businessComponentHooks`. |
| `lua/components/` | One `.lua` file per script type (promotions, audits, props demo, …). |
| `lua/lib/` | Optional shared Lua (e.g. math helpers) via `sharedLuaChunks`. |
| `generated/businessSurface.d.lua` | LuaLS stubs (regenerated; do not edit by hand). |
| `.luarc.json` | Points LuaLS at `./generated`; `component` as the only script global. |

## Commands

From the monorepo root:

```bash
pnpm --filter @microverse.ts/business-scripting-engine test
```

From this package:

```bash
pnpm run generate:lua-defs   # refresh generated/businessSurface.d.lua
pnpm test                    # pretest runs build + generate + vitest
```

## Notable scripts

| Lua file | Shows |
|----------|--------|
| `order_echo.lua` | Minimal `onOrderPlaced` + `self.bridges.notifications` |
| `props_demo.lua` | `init`, `onPropsChanged`, `properties` + `state` |
| `promotions.lua` | Multiple bridges and domain logic |
| `order_asyncio_tick.lua` | Async bridge with `onComplete` callback |
| `stateful_counter.lua` | Lua-local `state` across events |

Monorepo overview: [root README](../../README.md).
