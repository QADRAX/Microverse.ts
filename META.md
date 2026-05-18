# Microverse meta-repository layout

This repository hosts the **reference implementation** (`lua@1`, TypeScript) and, during the protocol rollout, the **spec** and **conformance** artifacts that will move to dedicated repositories.

## Structure

| Path | Role | Future repo |
|------|------|-------------|
| [`packages/surface-spec/`](packages/surface-spec/README.md) | Protocol npm package + JSON Schema | `microverse-spec` |
| [`spec/`](spec/README.md) | Protocol docs (points to package schema) | `microverse-spec` |
| [`conformance/`](conformance/README.md) | Vectors + validation | `microverse-conformance` |
| [`packages/`](packages/) | npm packages (`@microverse.ts/*`) | — |
| [`examples/`](examples/) | Live demos | — |
| [`implementations/typescript-lua/`](implementations/typescript-lua/README.md) | Docs for this implementation | `Microverse.ts` (this repo) |

## Git submodules

When split, use [`.gitmodules.example`](.gitmodules.example) in the umbrella **microverse** meta-repo:

```bash
git submodule update --init --recursive
```

## Commands

```bash
pnpm run conformance:export   # golden SurfaceSpec from examples
pnpm run conformance          # validate vectors + snapshots
```

See [spec/README.md](spec/README.md) for protocol versioning (`schemaVersion` vs `lua@1`).
