# `@microverse/cli`

CLI for **build-time** tasks in Microverse consumer projects. Commands are grouped by runtime (Lua today; other microverse types can add their own subcommands later).

Generation logic for Lua stubs lives in **`@microverse/lua-defs`** — use that package from TypeScript plugins or scripts when you do not need the binary.

## Installation

```bash
pnpm add -D @microverse/cli
```

The binary is `microverse` (`pnpm exec microverse`, or `npx microverse` when published).

In this monorepo:

```bash
pnpm exec microverse --help
pnpm exec microverse generate-lua-defs --help
```

## Commands

| Command | Description |
|---------|-------------|
| `generate-lua-defs` | Emit a single LuaCATS `.d.lua` file for **Lua** microverse host surfaces or JSON manifests. |
| `generate-defs` | **Deprecated** — alias of `generate-lua-defs` (prints a warning). |

Future runtimes might add e.g. `generate-<runtime>-defs` without changing the top-level binary name.

## `generate-lua-defs`

Produces [LuaCATS](https://luals.github.io/wiki/annotations/) stubs for LuaLS / the IDE.

### From a TypeScript host surface

```bash
microverse generate-lua-defs --surface src/mySurface.ts [--out <path>] [--header-note <text>]
```

- Module must **`export default`** the value from `defineHostSurface` / `defineHostSurfaceFor`.
- Default output: `generated/<surfaceBasename>.d.lua` (override with `--out`).
- `.ts` surfaces load via `tsx` (bundled with this CLI).

### From a JSON manifest

```bash
microverse generate-lua-defs --manifest ./lua/microverse.def.json [--out <path>]
```

Hand-authored or CI-exported `LuaDefManifest` — see [`@microverse/lua-defs`](../lua-defs/README.md).

### `package.json` script

```json
{
  "scripts": {
    "lua:defs": "microverse generate-lua-defs --surface ./src/mySurface.ts"
  }
}
```

### Programmatic (no CLI)

```ts
import { generateDefs } from '@microverse/lua-defs';

await generateDefs({ cwd: process.cwd(), manifestPath: './lua/microverse.def.json' });
```

## Keeping stubs aligned with runtime

1. Match manifest / surface names to what you inject at runtime (`mergeEnv` bridge tables).
2. Run generation in CI so drift fails the build.
3. Roadmap: export `LuaDefManifest` from TS at build time without a hand-maintained JSON file.

Schema: [lua-def-manifest.schema.json](../lua-defs/schemas/lua-def-manifest.schema.json).
