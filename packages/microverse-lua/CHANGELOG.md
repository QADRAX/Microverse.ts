# @microverse/microverse-lua

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
