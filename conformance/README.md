# Microverse conformance

Test vectors and validation scripts for **SurfaceSpec** exports from conforming implementations.

## Layout

| Path | Purpose |
|------|---------|
| [vectors/golden/](./vectors/golden/) | Golden `SurfaceSpec` JSON from reference examples (sorting-lab, chess-lab) |
| [vectors/surface-minimal.json](./vectors/surface-minimal.json) | Hand-written minimal surface |
| [vectors/surface-profiles-inheritance.json](./vectors/surface-profiles-inheritance.json) | Profile `extends` + capability inheritance |
| [vectors/surface-hooks.json](./vectors/surface-hooks.json) | Component hooks and per-profile hook subsets |

Validation runs from the TypeScript + Lua implementation: [`implementations/typescript-lua/scripts/validate-conformance.mjs`](../implementations/typescript-lua/scripts/validate-conformance.mjs) (schema: [`surface-spec.schema.json`](../implementations/typescript-lua/packages/surface-spec/schemas/surface-spec.schema.json)).

## Running locally

```bash
cd implementations/typescript-lua
pnpm install
pnpm run build
pnpm run conformance:export   # refresh golden exports from examples
pnpm run conformance          # validate schema + golden snapshots
```

## Expected behavior (capability deny)

Profile `AuditOnly` in `surface-profiles-inheritance.json` does not include `orders:read`. A conforming runtime must expose **no** `orders` bridge methods on `self.bridges` for that profile (absence, not runtime error). This is documented in vector README comments and [spec/lifecycle.md](../spec/lifecycle.md).

## Meta-repo

This directory is intended to become the **`microverse-conformance`** repository. See [spec/README.md](../spec/README.md).
