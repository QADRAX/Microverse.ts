# Microverse TypeScript + Lua (`lua@1`)

Reference implementation of the Microverse protocol for:

- **Host language:** TypeScript (Node ≥ 20, browser)
- **Script profile:** `lua@1` (Wasmoon Lua VM, LuaCATS stubs)

## Workspace layout

| Path | Role |
|------|------|
| [`packages/`](packages/) | npm packages (`@microverse.ts/*`) |
| [`examples/`](examples/) | Live demos (sorting-lab, chess-lab) |
| [`tooling/`](tooling/) | Shared ESLint, Prettier, TypeScript, Vite configs |
| [`scripts/`](scripts/) | Conformance export, GitHub Pages build |

Protocol docs and conformance vectors live at the **repository root**: [`spec/`](../../spec/README.md), [`conformance/`](../../conformance/README.md).

## Quick start

```bash
cd implementations/typescript-lua
pnpm install
pnpm run build
```

Consumer entry: [`@microverse.ts/microverse-lua`](packages/microverse-lua/README.md).

## Commands

| Script | Description |
|--------|-------------|
| `pnpm run build` | Build all packages (Turbo) |
| `pnpm run ci:microverse-lua` | Build, lint, typecheck, test for the publishable graph |
| `pnpm run conformance:export` | Refresh golden `SurfaceSpec` under `../../conformance/vectors/golden/` |
| `pnpm run conformance` | Validate vectors + golden snapshots |
| `pnpm run build:pages` | Static site from Vite examples → `.github-pages/` |
| `pnpm exec microverse codegen --help` | Emit `.surface.json` + `.d.lua` from a host surface |

## Live examples (GitHub Pages)

| Demo | Source |
|------|--------|
| [Sorting Lab](https://qadrax.github.io/Microverse.ts/sorting-lab/) | [`examples/sorting-lab`](examples/sorting-lab) |
| [Chess Lab](https://qadrax.github.io/Microverse.ts/chess-lab/) | [`examples/chess-lab`](examples/chess-lab) |

Build locally:

```bash
pnpm run build:pages
```

## Architecture (high level)

1. Model your **DSL** as a **host surface** (bridge methods + optional `componentHooks`).
2. Pass a **host** object and the surface into `MicroverseLua.create`.
3. Each script instance gets a Wasm **env slot**, capability allowlist, and scoped `self.bridges`.
4. The host emits domain events → Lua `on*` methods on mounted components.
5. At build time, `microverse codegen --surface …` produces **`.surface.json`** + **`.d.lua`** for LuaLS.

## Protocol export

```ts
const json = mySurface.toProtocolJson(); // default scriptProfile: lua@1
```

```bash
pnpm exec microverse codegen --surface ./src/engine/mySurface.ts
# or: pnpm run conformance:export && pnpm run conformance
```
