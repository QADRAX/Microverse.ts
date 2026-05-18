# @microverse/microverse-lua

## 0.3.0

### Minor Changes

- 9535dbf: Typed component profiles on the host surface: `.componentType()` with props, state, capabilities, and hook subsets (with inheritance). Runtime mounts bridges only via type singletons (`AuditOnly:extend()`). Generated `.d.lua` emits `AuditOnlyComponent`, `AuditOnlyProps`, `AuditOnlyState`, and narrowed `AuditOnlyBridges`.

  **Breaking:** Removed `mountScriptInstance({ capabilities })` and per-instance capability allowlists. Removed generic `component:extend()`. Removed runtime `capability denied` throws; disallowed bridges are absent from `self.bridges`. Migrate Lua to `local C = YourType:extend()` and declare component types on the surface.

  Other packages in the monorepo **fixed** group (`runtime-bridge`, `runtime-wasm`, `shared`, etc.) publish at the same minor version when this changeset is released.

- 9535dbf: Script-centric profiles for game-engine style integrators: `LuaScriptDefinition.profileId`, host-applied profile at `openSession` (props/`init` without requiring `Type:extend()` in Lua), narrowed bridge `mergeEnv` per active profile, optional `ScriptReferenceResolver` + `self.references`, and script catalog LuaCATS helpers (`buildScriptCatalogLuaDefManifest`). Surface `.componentType()` remains optional for codegen. Also versions the fixed group (`lua-defs`, `runtime-bridge`, etc.).

### Patch Changes

- Updated dependencies [9535dbf]
- Updated dependencies [9535dbf]
  - @microverse.ts/host-surface@0.3.0
  - @microverse.ts/runtime-core@0.3.0
  - @microverse.ts/runtime-bridge@0.3.0
  - @microverse.ts/runtime-lua@0.3.0
  - @microverse.ts/runtime-wasm@0.3.0
  - @microverse.ts/runtime-zod@0.3.0
  - @microverse.ts/shared@0.3.0
  - @microverse.ts/runtime-capabilities@0.3.0

## 0.2.0

### Patch Changes

- 19c44a7: class base components
- Updated dependencies [19c44a7]
  - @microverse.ts/runtime-bridge@0.2.0
  - @microverse.ts/runtime-capabilities@0.2.0
  - @microverse.ts/runtime-core@0.2.0
  - @microverse.ts/runtime-lua@0.2.0
  - @microverse.ts/runtime-wasm@0.2.0
  - @microverse.ts/runtime-zod@0.2.0
  - @microverse.ts/host-surface@0.2.0
  - @microverse.ts/shared@0.2.0

## Unreleased

### Minor Changes

- Script catalog and instances: `registerScriptDefinition`, `mountScriptInstance`, `unmountScriptInstance`, props sync (`setInstanceProps`, `patchInstanceProps`, `flushInstanceProps`), and `ScriptInstanceContext` on bridge handlers.
- `emitToAllInstances` broadcasts domain events to every mounted component instance.

### Breaking Changes

- Surfaces use `.componentHooks()` instead of `.workflowHooks()`. `HostComponentHooksSpec` replaces `HostWorkflowHooksSpec`.

## 0.1.0

### Minor Changes

- 035eccc: Initial public release of the Lua microverse facade and synchronized `@microverse.ts/*` runtime packages.

### Patch Changes

- @microverse.ts/shared@0.1.0
- @microverse.ts/runtime-core@0.1.0
- @microverse.ts/runtime-lua@0.1.0
- @microverse.ts/runtime-capabilities@0.1.0
- @microverse.ts/runtime-bridge@0.1.0
- @microverse.ts/runtime-zod@0.1.0
- @microverse.ts/host-surface@0.1.0
- @microverse.ts/runtime-wasm@0.1.0

## 0.1.0

### Minor Changes

- 035eccc: Initial public release of the Lua microverse facade and synchronized `@microverse/*` runtime packages.

### Patch Changes

- @microverse/shared@0.1.0
- @microverse/runtime-core@0.1.0
- @microverse/runtime-lua@0.1.0
- @microverse/runtime-capabilities@0.1.0
- @microverse/runtime-bridge@0.1.0
- @microverse/runtime-zod@0.1.0
- @microverse/host-surface@0.1.0
- @microverse/runtime-wasm@0.1.0
