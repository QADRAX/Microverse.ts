# `@microverse/microverse-lua`

**Lua microverse** facade for TypeScript applications: `MicroverseLua.create`, Wasm VM, script slots, and re-exports for host surfaces and bridges.

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
pnpm add @microverse/microverse-lua
```

Workspace: `"@microverse/microverse-lua": "workspace:*"`.

## Quick start

```ts
import {
  MicroverseLua,
  defineHostSurfaceFor,
  fn,
  cap,
  fixedTimeout,
} from '@microverse/microverse-lua';
import { z } from 'zod';

type MyHost = { appName: string };

const surface = defineHostSurfaceFor({
  greet: {
    hello: fn<MyHost, { name: string }, string>({
      capability: cap('demo:greet'),
      input: z.object({ name: z.string() }),
      output: z.string(),
      handler: ({ host }, { name }) => `Hello, ${name} from ${host.appName}`,
    }),
  },
});

const microverse = MicroverseLua.create({
  host: { appName: 'Acme' },
  surface,
  defaultTimeout: fixedTimeout(30_000),
});

await microverse.registerScript({
  scriptId: 'welcome',
  script: `local msg = greet:hello({ name = "world" })`,
  capabilities: surface.pickCapabilities('demo:greet'),
});

await microverse.dispose();
```

## API

| Export | Purpose |
|--------|---------|
| `MicroverseLua.create` | Create a Lua microverse (Wasm VM included). |
| `registerScript` | New slot + optional preludes + main chunk. |
| `emitToAllScripts` | Call `on{Kind}` on every script (workflow hooks). |
| `defineHostSurface`, `defineHostSurfaceFor`, `fn`, `cap` | Surface builders (from `@microverse/host-surface`). |

See [`@microverse/host-surface`](../host-surface/README.md) for surface authoring.

## IDE stubs

```bash
pnpm add -D @microverse/cli
pnpm exec microverse generate-lua-defs --surface src/mySurface.ts
```

Requires `export default` on the surface module. Details: [`@microverse/cli`](../cli/README.md).

## Reference example

[`examples/business-scripting-engine`](../../examples/business-scripting-engine) — rules engine with orders, billing, workflow Lua, and `BusinessScriptingEngine` wrapping this package.

## Related

- Async bridges: [`host-surface/docs/async-subroutines-components.md`](../host-surface/docs/async-subroutines-components.md)
- Component-style Lua: [`examples/.../COMPONENT_PATTERN.md`](../../examples/business-scripting-engine/docs/COMPONENT_PATTERN.md)
