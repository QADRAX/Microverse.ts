# @microverse/runtime-core

## 0.3.0

### Minor Changes

- 9535dbf: Typed component profiles on the host surface: `.componentType()` with props, state, capabilities, and hook subsets (with inheritance). Runtime mounts bridges only via type singletons (`AuditOnly:extend()`). Generated `.d.lua` emits `AuditOnlyComponent`, `AuditOnlyProps`, `AuditOnlyState`, and narrowed `AuditOnlyBridges`.

  **Breaking:** Removed `mountScriptInstance({ capabilities })` and per-instance capability allowlists. Removed generic `component:extend()`. Removed runtime `capability denied` throws; disallowed bridges are absent from `self.bridges`. Migrate Lua to `local C = YourType:extend()` and declare component types on the surface.

  Other packages in the monorepo **fixed** group (`runtime-bridge`, `runtime-wasm`, `shared`, etc.) publish at the same minor version when this changeset is released.

- 9535dbf: Script-centric profiles for game-engine style integrators: `LuaScriptDefinition.profileId`, host-applied profile at `openSession` (props/`init` without requiring `Type:extend()` in Lua), narrowed bridge `mergeEnv` per active profile, optional `ScriptReferenceResolver` + `self.references`, and script catalog LuaCATS helpers (`buildScriptCatalogLuaDefManifest`). Surface `.componentType()` remains optional for codegen. Also versions the fixed group (`lua-defs`, `runtime-bridge`, etc.).

### Patch Changes

- @microverse.ts/shared@0.3.0

## 0.2.0

### Minor Changes

- 19c44a7: class base components

### Patch Changes

- Updated dependencies [19c44a7]
  - @microverse.ts/shared@0.2.0

## Unreleased

### Minor Changes

- `ScriptPropertyBag` / `ScriptPropertyValue`, diff/apply helpers, `LuaScriptDefinition`, `ScriptInstanceContext`, and `ScriptAuditEvent` types.

## 0.1.0

### Patch Changes

- @microverse.ts/shared@0.1.0

## 0.1.0

### Patch Changes

- @microverse/shared@0.1.0
