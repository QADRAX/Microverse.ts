# Microverse TypeScript + Lua (`lua@1`)

This directory documents the **reference implementation** of the Microverse protocol for:

- **Host language:** TypeScript (Node ≥ 20, browser)
- **Script profile:** `lua@1` (Wasmoon Lua VM, LuaCATS stubs)

## Where is the code?

The implementation currently lives at the **repository root** (historical layout). Package sources are under [`packages/`](../../packages/); examples under [`examples/`](../../examples/).

When the meta-repo uses git submodules, this folder will become the submodule checkout of `microverse-typescript-lua` (GitHub: [Microverse.ts](https://github.com/QADRAX/Microverse.ts)).

## Consumer entry

Install and use [`@microverse.ts/microverse-lua`](../../packages/microverse-lua/README.md).

## Conformance

Export surfaces with `surface.toProtocolJson()` and validate against [`spec/surface-spec.schema.json`](../../spec/surface-spec.schema.json). CI runs `pnpm run conformance` from the repo root.
