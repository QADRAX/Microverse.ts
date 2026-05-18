# @microverse/host-surface

## 0.3.0

### Minor Changes

- 9535dbf: Typed component profiles on the host surface: `.componentType()` with props, state, capabilities, and hook subsets (with inheritance). Runtime mounts bridges only via type singletons (`AuditOnly:extend()`). Generated `.d.lua` emits `AuditOnlyComponent`, `AuditOnlyProps`, `AuditOnlyState`, and narrowed `AuditOnlyBridges`.

  **Breaking:** Removed `mountScriptInstance({ capabilities })` and per-instance capability allowlists. Removed generic `component:extend()`. Removed runtime `capability denied` throws; disallowed bridges are absent from `self.bridges`. Migrate Lua to `local C = YourType:extend()` and declare component types on the surface.

  Other packages in the monorepo **fixed** group (`runtime-bridge`, `runtime-wasm`, `shared`, etc.) publish at the same minor version when this changeset is released.

- 9535dbf: Script-centric profiles for game-engine style integrators: `LuaScriptDefinition.profileId`, host-applied profile at `openSession` (props/`init` without requiring `Type:extend()` in Lua), narrowed bridge `mergeEnv` per active profile, optional `ScriptReferenceResolver` + `self.references`, and script catalog LuaCATS helpers (`buildScriptCatalogLuaDefManifest`). Surface `.componentType()` remains optional for codegen. Also versions the fixed group (`lua-defs`, `runtime-bridge`, etc.).

### Patch Changes

- Updated dependencies [9535dbf]
- Updated dependencies [9535dbf]
  - @microverse.ts/lua-defs@0.3.0
  - @microverse.ts/runtime-core@0.3.0
  - @microverse.ts/runtime-bridge@0.3.0
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
  - @microverse.ts/runtime-zod@0.2.0
  - @microverse.ts/lua-defs@0.2.0
  - @microverse.ts/shared@0.2.0

## Unreleased

### Minor Changes

- Component runtime prelude (`component:extend()`, `properties` proxy, `state`, `bridges`) with host sync via `mergeEnv` and bidirectional dirty flush.
- `HostFnContext.script` for audit-aware bridge handlers.

### Breaking Changes

- Removed workflow scripting: `workflow:extend()`, `Workflow`, and `.workflowHooks()`. Use `.componentHooks()` and `component:extend()` with `on*` methods instead.
- Bridges are scoped to `self.bridges` (no global bridge singletons in `.d.lua`).
- LuaCATS: `ScriptInstance` renamed to `Component`; event payloads are `MicroverseEvt_*` (was `MicroverseWorkflowEvt_*`).
- `invokeGlobalHookIfPresent` removed; use `invokeComponentEventHook`. `onDestroy` lifecycle hook on unmount.

## 0.1.0

### Patch Changes

- @microverse.ts/shared@0.1.0
- @microverse.ts/runtime-core@0.1.0
- @microverse.ts/lua-defs@0.1.0
- @microverse.ts/runtime-capabilities@0.1.0
- @microverse.ts/runtime-bridge@0.1.0
- @microverse.ts/runtime-zod@0.1.0

## 0.1.0

### Patch Changes

- @microverse/shared@0.1.0
- @microverse/runtime-core@0.1.0
- @microverse/lua-defs@0.1.0
- @microverse/runtime-capabilities@0.1.0
- @microverse/runtime-bridge@0.1.0
- @microverse/runtime-zod@0.1.0
