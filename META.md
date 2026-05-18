# Microverse meta-repository layout

This repository hosts the **reference implementation** (`lua@1`, TypeScript) and, during the protocol rollout, the **spec** and **conformance** artifacts that will move to dedicated repositories.

## Structure

| Path | Role | Future repo |
|------|------|-------------|
| [`spec/`](spec/README.md) | Protocol docs (schema lives in implementation package) | `microverse-spec` |
| [`conformance/`](conformance/README.md) | Vectors + validation | `microverse-conformance` |
| [`implementations/typescript-lua/`](implementations/typescript-lua/README.md) | pnpm monorepo: `packages/`, `examples/`, CLI | `Microverse.ts` |
| [`implementations/typescript-lua/packages/surface-spec/`](implementations/typescript-lua/packages/surface-spec/README.md) | Protocol npm package + JSON Schema | `microverse-spec` (npm) |

## Git submodules

When split, use [`.gitmodules.example`](.gitmodules.example) in the umbrella **microverse** meta-repo:

```bash
git submodule update --init --recursive
```

## Commands

From [`implementations/typescript-lua/`](implementations/typescript-lua/README.md):

```bash
cd implementations/typescript-lua
pnpm install
pnpm run conformance:export   # golden SurfaceSpec from examples
pnpm run conformance          # validate vectors + snapshots
```

See [spec/README.md](spec/README.md) for protocol versioning (`schemaVersion` vs `lua@1`).
