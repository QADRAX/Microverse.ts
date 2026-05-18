# `@microverse.ts/host-surface`

Declare a **host surface** in TypeScript: Zod schemas, capabilities, component types, and handlers that compile into:

1. **Runtime bridge tables** for `mergeEnv` (what Lua calls at execution time).
2. A **`LuaDefManifest`** for `@microverse.ts/lua-defs` (`.d.lua` stubs for LuaLS) — **profile `lua@1`**.
3. A **`SurfaceSpec`** JSON document via `toProtocolJson()` for [protocol conformance](../../spec/README.md).

Most applications import **`defineHostSurfaceFor`** from **`@microverse.ts/microverse-lua`** instead of this package directly. Use `@microverse.ts/host-surface` when you need `HostScriptSession` or custom runtime wiring.

Monorepo overview: [root README](../../README.md). Lua microverse lifecycle: [`@microverse.ts/microverse-lua`](../microverse-lua/README.md).

## Protocol export

```ts
const spec = mySurface.toProtocolJson(); // scriptProfile defaults to lua@1
```

Handlers are omitted; bridge methods include JSON Schema for `input` / `output`. See [`spec/surface-spec.schema.json`](../../spec/surface-spec.schema.json) and [`spec/mapping.md`](../../spec/mapping.md).

Source layout: `src/domain/protocol/` (contract), `src/domain/lua/` (LuaCATS manifest builders).

## Defining a surface

```ts
import { defineHostSurfaceFor } from '@microverse.ts/microverse-lua';
import { z } from 'zod';

export default defineHostSurfaceFor<MyHost>()
  .componentType('OrderEcho', {
    extends: 'AuditOnly',
    capabilities: ['orders:read', 'notifications:send'],
    props: z.object({ label: z.string().optional() }),
    state: z.object({}),
    hooks: ['OrderPlaced'],
  })
  .componentType('AuditOnly', {
    capabilities: ['audit:record'],
    props: z.object({}),
    state: z.object({}),
    hooks: ['OrderPlaced'],
  })
  .bridge('orders')
  .method('get', {
    requires: 'orders:read',
    input: z.object({ orderId: z.string() }),
    output: orderDto,
    description: 'Load order by id',
    handler: ({ host }, { orderId }) => host.orders.get(orderId),
  })
  .componentHooks(componentHooks) // optional
  .build();
```

| Step | Role |
|------|------|
| `defineHostSurfaceFor<THost>()` | Start builder; `handler` receives typed `host`. |
| `.componentType(name, …)` | Declares props, state, capability set, and hook subset for Lua `Name:extend()`. |
| `.bridge('orders')` | Bridge table on `self.bridges` after `OrderEcho:extend()` (only bridges allowed by the active type). |
| `.method('get', { … })` | One bridge method: `requires`, `input`, `output`, `handler`. |
| `.componentHooks(…)` | Optional Zod map → `on*` domain events; each type lists which hooks it implements. |
| `.build()` | Compiled {@link HostSurface} with `componentTypes` registry. |

`requires` is a `domain:action` capability string on each bridge method. Each **component type** lists which capabilities its instances may use; runtime mounts only those bridges/methods on `self.bridges`. Disallowed bridges are **absent** (`nil` in Lua), not denied at call time.

Bridges are **not** global in the slot: use `self.bridges.orders:get(…)` from component methods after `YourType:extend()`.

### Host object

The **host** is your engine context (services, repos, config). It is not generated here—you construct it in your app and pass it to `MicroverseLua.create({ host, surface })` or `HostScriptSession`.

### Component domain events

Call `.componentHooks({ OrderPlaced: z.object({ … }), … })` before `.build()`.

- TypeScript emits via `emitToAllInstances('OrderPlaced', payload)`.
- Lua implements `onOrderPlaced` on the table from `OrderEcho:extend()` (when that type’s `hooks` includes `OrderPlaced`).
- Manifest emits `MicroverseEvt_*` payload classes and per-type `on*` fields on `OrderEchoComponent` in `.d.lua`.

### Component types and inheritance

| Field | Rule |
|-------|------|
| `capabilities` | Union of parent + child (deduplicated). |
| `props` / `state` | Zod `parent.extend(childShape)`. |
| `hooks` | Union of parent + child hook names. |

`extends` must reference another type on the same surface. Names must be unique; cycles are rejected at `build()`.

## `HostScriptSession`

Lower-level API when you manage slots yourself (one session = one env slot):

```ts
const session = new HostScriptSession({
  runtime,
  surface,
  host,
  slotKey: createLuaEnvSlotKey('script:my-id'),
});
await session.openSession();
await session.runChunk(luaSource); // script must call YourType:extend() first
await session.setProps({ … }); // validated against active type’s props schema
```

`MicroverseLua` in `@microverse.ts/microverse-lua` wraps this for the common case (shared VM, script catalog + instances, broadcast hooks).

## Generating `.d.lua`

```bash
microverse codegen --surface src/mySurface.ts
```

Requires `export default` of the compiled surface (`.build()` result). The manifest emits, per component type:

- `AuditOnlyProps`, `AuditOnlyState`, `AuditOnlyBridges`
- `AuditOnlyComponent` (with `on*` only for that type’s hooks)
- `AuditOnly:extend() → AuditOnlyComponent` singleton stub

See [`@microverse.ts/cli`](../cli/README.md) and [`@microverse.ts/lua-defs`](../lua-defs/README.md).

Optional **Lua type names** on Zod schemas (`luaType('OrderDto', z.object({ … }))`) improve stub names—see bridge payload patterns in consumer surfaces (e.g. `examples/sorting-lab`).

## Async bridges and Lua patterns

Bridge handlers are **synchronous at the Lua boundary**; Wasmoon does not auto-resolve `Promise` into Lua values. For async TypeScript work, use an `async` handler on the surface; Lua calls the bridge with `:await()` or an `onComplete` callback. See:

- [Async bridges — `@microverse.ts/microverse-lua`](../microverse-lua/README.md#async-bridges)
- [Lua authoring (components)](../microverse-lua/README.md#lua-authoring)
- Example: [`bubble_sort.lua`](../../examples/sorting-lab/lua/bubble_sort.lua)

## Reference

- Example surface: [`examples/sorting-lab/src/engine/sortingSurface.ts`](../../examples/sorting-lab/src/engine/sortingSurface.ts)
- Tests: `src/domain/`, `src/application/`, `src/infrastructure/`
