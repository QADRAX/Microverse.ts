---
"@microverse.ts/host-surface": minor
"@microverse.ts/microverse-lua": minor
"@microverse.ts/lua-defs": minor
"@microverse.ts/runtime-core": minor
---

Typed component profiles on the host surface: `.componentType()` with props, state, capabilities, and hook subsets (with inheritance). Runtime mounts bridges only via type singletons (`AuditOnly:extend()`). Generated `.d.lua` emits `AuditOnlyComponent`, `AuditOnlyProps`, `AuditOnlyState`, and narrowed `AuditOnlyBridges`.

**Breaking:** Removed `mountScriptInstance({ capabilities })` and per-instance capability allowlists. Removed generic `component:extend()`. Removed runtime `capability denied` throws; disallowed bridges are absent from `self.bridges`. Migrate Lua to `local C = YourType:extend()` and declare component types on the surface.

Other packages in the monorepo **fixed** group (`runtime-bridge`, `runtime-wasm`, `shared`, etc.) publish at the same minor version when this changeset is released.
