# `@microverse.ts/microverse-lua`

**Lua microverse** facade for TypeScript applications: `MicroverseLua.create`, Wasm VM, script slots, and the fluent host surface builder.

Monorepo overview: [root README](../../README.md).

## What is a Lua microverse?

One logical scripting universe in your process:

- **One** Wasm-backed Lua VM (Wasmoon), shared for efficiency.
- **Many** isolated **environment slots** — one per registered script.
- **One** host **surface** (declarative bridges + optional workflow hooks).
- **One** host **object** (your TypeScript services).
- **Per-script capability allowlists** at registration.

```
┌─────────────────────────────────────────────────────────────┐
│  LuaMicroverse (MicroverseLua.create)                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Shared Wasm Lua VM                                   │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │  │
│  │  │ slot: a     │ │ slot: b     │ │ slot: c     │     │  │
│  │  │ caps: […]   │ │ caps: […]   │ │ caps: […]   │     │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘     │  │
│  └───────────────────────────────────────────────────────┘  │
│         ▲ bridges from host surface + host services         │
└─────────────────────────────────────────────────────────────┘
```

## Install

```bash
pnpm add @microverse.ts/microverse-lua
```

Workspace: `"@microverse.ts/microverse-lua": "workspace:*"`.

## Quick start

```ts
import { MicroverseLua, defineHostSurfaceFor } from '@microverse.ts/microverse-lua';
import { z } from 'zod';

type MyHost = { appName: string };

const surface = defineHostSurfaceFor<MyHost>()
  .bridge('greet')
  .method('hello', {
    requires: 'demo:greet',
    input: z.object({ name: z.string() }),
    output: z.string(),
    handler: ({ host }, { name }) => `Hello, ${name} from ${host.appName}`,
  })
  .build();

const microverse = MicroverseLua.create({
  host: { appName: 'Acme' },
  surface,
  defaultTimeoutMs: 30_000,
});

microverse.registerScriptDefinition({
  scriptId: 'welcome',
  source: `local msg = greet:hello({ name = "world" })`,
});
await microverse.mountScriptInstance({
  instanceId: 'welcome',
  scriptId: 'welcome',
  capabilities: surface.pickCapabilities('demo:greet'),
});

await microverse.dispose();
```

## API

| Export | Purpose |
|--------|---------|
| `MicroverseLua.create` | Create a Lua microverse (Wasm VM included). |
| `registerScriptDefinition` | Catalog entry (source, optional props schema, preludes). |
| `mountScriptInstance` | New Wasm slot for one instance (capabilities, props, audit). |
| `emitToAllInstances` | Call `on{Kind}` on every mounted instance (workflow hooks). |
| `defineHostSurfaceFor`, `defineHostSurface` | Fluent surface builder (`bridge` → `method` → `build`). |

## IDE stubs

```bash
pnpm add -D @microverse.ts/cli
pnpm exec microverse generate-lua-defs --surface src/mySurface.ts
```

Requires `export default` on the surface module (typically the result of `.build()`). Details: [`@microverse.ts/cli`](../cli/README.md).

## Reference example

[`examples/business-scripting-engine`](../../examples/business-scripting-engine) — rules engine with orders, billing, workflow Lua, and `BusinessScriptingEngine` wrapping this package.

## Related

- Async bridges: [`host-surface/docs/async-subroutines-components.md`](../host-surface/docs/async-subroutines-components.md)
- Component-style Lua: [`examples/.../COMPONENT_PATTERN.md`](../../examples/business-scripting-engine/docs/COMPONENT_PATTERN.md)
