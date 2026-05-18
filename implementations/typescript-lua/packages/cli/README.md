# `@microverse.ts/cli`

CLI for **build-time** tasks in Microverse consumer projects. Commands are grouped by runtime (Lua today; other microverse types can add their own subcommands later).

Generation logic for Lua stubs lives in **`@microverse.ts/lua-defs`** — use that package from TypeScript plugins or scripts when you do not need the binary.

## Installation

```bash
pnpm add -D @microverse.ts/cli
```

The binary is `microverse` (`pnpm exec microverse`, or `npx microverse` when published).

In this monorepo:

```bash
pnpm exec microverse --help
pnpm exec microverse codegen --help
```

## Commands

| Command | Description |
|---------|-------------|
| `codegen` | Emit **`*.surface.json`** (protocol) + **`*.d.lua`** (LuaCATS) from a TypeScript host surface. |

## `codegen`

```bash
microverse codegen --surface src/mySurface.ts [--out-dir generated]
```

Writes `generated/<basename>.surface.json` and `generated/<basename>.d.lua` from the same `export default` surface module.

Regenerate `.d.lua` from existing protocol JSON:

```bash
microverse codegen --spec ./generated/mySurface.surface.json
```

### `package.json` script

```json
{
  "scripts": {
    "microverse:codegen": "microverse codegen --surface ./src/mySurface.ts"
  }
}
```

### Programmatic (no CLI)

```ts
import { generateDefs } from '@microverse.ts/lua-defs';

await generateDefs({ cwd: process.cwd(), manifestPath: './lua/microverse.def.json' });
```

## Keeping stubs aligned with runtime

1. Match manifest / surface names to what you inject at runtime (`mergeEnv` bridge tables).
2. Run generation in CI so drift fails the build.
3. Roadmap: export `LuaDefManifest` from TS at build time without a hand-maintained JSON file.

Schema: [lua-def-manifest.schema.json](../lua-defs/schemas/lua-def-manifest.schema.json).
