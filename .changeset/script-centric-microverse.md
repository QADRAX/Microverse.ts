---
"@microverse.ts/host-surface": minor
"@microverse.ts/microverse-lua": minor
"@microverse.ts/runtime-core": minor
---

Script-centric profiles for game-engine style integrators: `LuaScriptDefinition.profileId`, host-applied profile at `openSession` (props/`init` without requiring `Type:extend()` in Lua), narrowed bridge `mergeEnv` per active profile, optional `ScriptReferenceResolver` + `self.references`, and script catalog LuaCATS helpers (`buildScriptCatalogLuaDefManifest`). Surface `.componentType()` remains optional for codegen. Also versions the fixed group (`lua-defs`, `runtime-bridge`, etc.).
