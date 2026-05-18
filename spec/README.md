# Microverse protocol specification

Language-neutral contract for **host surfaces**: declarative bridges, capability allowlists, script profiles (component types), and host → script events.

This directory is the source of truth for protocol **v0.1** and is intended to be published as the **`microverse-spec`** repository. In this monorepo it lives at `spec/` until the meta-repo split is completed.

## Contents

| File | Purpose |
|------|---------|
| [surface-spec.schema.json](../packages/surface-spec/schemas/surface-spec.schema.json) | JSON Schema for exported `SurfaceSpec` documents (npm: `@microverse.ts/surface-spec/schema`) |
| [lifecycle.md](./lifecycle.md) | Slot lifecycle, capabilities, and events (runtime-agnostic) |
| [mapping.md](./mapping.md) | Maps protocol fields to `@microverse.ts/host-surface` types |
| [CHANGELOG.md](./CHANGELOG.md) | Protocol semver history |

## Versioning

- **Protocol** (`schemaVersion` in JSON): semver of the `SurfaceSpec` document shape.
- **Script profile** (e.g. `lua@1`): semver of a concrete scripting runtime + DX artifacts (LuaCATS, preludes). Declared on export, not inside every field.

Implementations MUST document which script profiles they support. The reference TypeScript + Lua implementation is **`lua@1`** ([`@microverse.ts/microverse-lua`](../packages/microverse-lua/README.md)).

## Meta-repo layout

When using git submodules, clone the umbrella repo and run:

```bash
git submodule update --init --recursive
```

Expected layout:

```
microverse/                    # meta-repo
  spec/                        # this repo → microverse-spec
  conformance/                 # microverse-conformance
  implementations/
    typescript-lua/            # Microverse.ts (this monorepo root today)
```

See [`.gitmodules.example`](../.gitmodules.example) at the repository root.
