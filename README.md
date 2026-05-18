# Microverse

**A protocol-in-progress for sandboxed, domain-specific scripting in applications.**

Microverse is a project under active development. The goal is a **protocol** that lets applications host **microverses**—isolated sandboxes where user or domain logic runs against a **host-defined API** (your DSL), not arbitrary OS or network access.

**Microverse Lua** (`lua@1`) is the first concrete **script profile**. The reference TypeScript + Lua implementation lives under [`implementations/typescript-lua/`](implementations/typescript-lua/README.md).

## Repository layout

| Path | Role |
|------|------|
| [`spec/`](spec/README.md) | Protocol specification (language-neutral) |
| [`conformance/`](conformance/README.md) | Test vectors and golden `SurfaceSpec` exports |
| [`implementations/typescript-lua/`](implementations/typescript-lua/README.md) | pnpm monorepo: `@microverse.ts/*`, examples, CLI |

See [META.md](META.md) for the planned meta-repo layout (git submodules).

## Protocol vs implementation

| | |
|---|---|
| **Protocol v0.1** | [`SurfaceSpec`](implementations/typescript-lua/packages/surface-spec/schemas/surface-spec.schema.json) JSON export, [lifecycle](spec/lifecycle.md), CI conformance |
| **Implemented now** | **microverse.ts** — [`@microverse.ts/microverse-lua`](implementations/typescript-lua/packages/microverse-lua/README.md) |
| **Aspiration** | Additional script profiles and host languages sharing the same `SurfaceSpec` contract |

## Development (TypeScript + Lua)

All Node tooling runs from the implementation workspace:

```bash
cd implementations/typescript-lua
pnpm install
pnpm run build
pnpm run ci:microverse-lua
pnpm run conformance:export
pnpm run conformance
```

Live demos: [GitHub Pages](https://qadrax.github.io/Microverse.ts/) (built from [`examples/`](implementations/typescript-lua/examples/)).

## Documentation

| Topic | Location |
|-------|----------|
| Install, API, Lua authoring | [`packages/microverse-lua/README.md`](implementations/typescript-lua/packages/microverse-lua/README.md) |
| Protocol schema + lifecycle | [`spec/README.md`](spec/README.md) |
| Conformance vectors | [`conformance/README.md`](conformance/README.md) |
| Implementation monorepo | [`implementations/typescript-lua/README.md`](implementations/typescript-lua/README.md) |
