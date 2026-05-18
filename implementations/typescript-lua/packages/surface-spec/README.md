# `@microverse.ts/surface-spec`

Language-neutral **Microverse host surface** contract: `SurfaceSpec` JSON schema, document types, validation, and build-time type operators.

Published on npm as part of the `@microverse.ts/*` fixed version group with `@microverse.ts/microverse-lua`.

## Schema

- [schemas/surface-spec.schema.json](./schemas/surface-spec.schema.json) — also importable as `@microverse.ts/surface-spec/schema`

## Usage

```ts
import {
  assembleSurfaceSpecDocument,
  parseSurfaceSpecJson,
  validateSurfaceSpecDocument,
  type SurfaceSpecDocument,
} from '@microverse.ts/surface-spec';
```

Host applications typically author surfaces in TypeScript (`@microverse.ts/host-surface`) and export `SurfaceSpec` JSON at build time via `@microverse.ts/cli codegen`.

## Related packages

| Package | Role |
|---------|------|
| `@microverse.ts/host-surface` | Zod builder + handlers → `SurfaceSpecDocument` |
| `@microverse.ts/lua-defs` | `SurfaceSpec` → `.d.lua` (profile `lua@1`) |
| `@microverse.ts/microverse-lua` | Runtime (uses compiled TS surface, not JSON) |
