# `@microverse.ts/host-surface`

Declare a **host surface** in TypeScript: Zod schemas, capabilities, and handlers that compile into:

1. **Runtime bridge tables** for `mergeEnv` (what Lua calls at execution time).
2. A **`LuaDefManifest`** for `@microverse.ts/lua-defs` (`.d.lua` stubs for LuaLS).

Most applications import **`defineHostSurfaceFor`** from **`@microverse.ts/microverse-lua`** instead of this package directly. Use `@microverse.ts/host-surface` when you need `HostScriptSession` or custom runtime wiring.

Monorepo overview: [root README](../../README.md). Lua microverse lifecycle: [`@microverse.ts/microverse-lua`](../microverse-lua/README.md).

## Defining a surface

```ts
import { defineHostSurfaceFor } from '@microverse.ts/microverse-lua';
import { z } from 'zod';

export default defineHostSurfaceFor<MyHost>()
  .bridge('orders')
  .method('get', {
    requires: 'orders:read',
    input: z.object({ orderId: z.string() }),
    output: orderDto,
    description: 'Load order by id',
    handler: ({ host }, { orderId }) => host.orders.get(orderId),
  })
  .workflowHooks(workflowHooks) // optional
  .build();
```

| Step | Role |
|------|------|
| `defineHostSurfaceFor<THost>()` | Start builder; `handler` receives typed `host`. |
| `.bridge('orders')` | Lua global table name. |
| `.method('get', { … })` | One bridge method: `requires`, `input`, `output`, `handler`. |
| `.workflowHooks(…)` | Optional Zod map → `on*` hooks in Lua. |
| `.build()` | Compiled {@link HostSurface}. |

`requires` is a `domain:action` capability string. `async` is inferred from `async function` handlers.

Bridge names become **Lua global tables** (`orders`, `billing`, …). Do not use `workflow` as a bridge name when workflow hooks are enabled—that name is reserved for the injected `workflow:extend()` helper.

### Host object

The **host** is your engine context (services, repos, config). It is not generated here—you construct it in your app and pass it to `MicroverseLua.create({ host, surface })` or `HostScriptSession`.

### Workflow hooks

Call `.workflowHooks({ OrderPlaced: z.object({ … }), … })` before `.build()`.

- TypeScript emits via `emitToAllScripts('OrderPlaced', payload)`.
- Lua implements `onOrderPlaced` on the table from `workflow:extend()`.
- Manifest includes `MicroverseWorkflowEvt_*` classes in `.d.lua`.

## `HostScriptSession`

Lower-level API when you manage slots yourself (one session = one env slot + capability allowlist):

```ts
const session = new HostScriptSession({
  runtime,
  surface,
  host,
  slotKey: createLuaEnvSlotKey('script:my-id'),
  allowedCapabilities: surface.pickCapabilities('orders:read'),
});
await session.openSession();
await session.runChunk(luaSource);
```

`MicroverseLua` in `@microverse.ts/microverse-lua` wraps this for the common case (shared VM, `registerScript`, broadcast hooks).

## Generating `.d.lua`

```bash
microverse generate-lua-defs --surface src/mySurface.ts
```

Requires `export default` of the compiled surface (`.build()` result). See [`@microverse.ts/cli`](../cli/README.md) and [`@microverse.ts/lua-defs`](../lua-defs/README.md).

Optional **Lua type names** on Zod schemas (`luaType('OrderDto', z.object({ … }))`) improve stub names—see `examples/business-scripting-engine/src/schemas/surface/bridgePayloads.ts`.

## Async bridges and Lua patterns

Bridge handlers are **synchronous at the Lua boundary**; Wasmoon does not auto-resolve `Promise` into Lua values. For async TypeScript work, use the async bridge pattern (`:await()` or `onComplete` callback) documented in:

- [docs/async-subroutines-components.md](docs/async-subroutines-components.md)
- [examples/business-scripting-engine/docs/COMPONENT_PATTERN.md](../../examples/business-scripting-engine/docs/COMPONENT_PATTERN.md)

## Reference

- Example surface: [`examples/business-scripting-engine/src/businessSurface.ts`](../../examples/business-scripting-engine/src/businessSurface.ts)
- Tests: `src/domain/`, `src/application/`, `src/infrastructure/`
