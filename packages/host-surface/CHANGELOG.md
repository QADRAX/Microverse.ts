# @microverse/host-surface

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
