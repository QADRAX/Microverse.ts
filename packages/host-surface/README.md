# `@microverse/host-surface`

Define una **superficie de host** en TypeScript con Zod y capabilities: genera tablas para `mergeEnv` (`buildDeclarativeBridgeTable`) y un `LuaDefManifest` para `@microverse/lua-defs` (`.d.lua`).

Ver tests bajo `src/domain/`, `src/application/` (puertos y casos de uso), `src/infrastructure/adapters|builders|components/` y el ejemplo `examples/business-scripting-engine`.

## Async, subrutinas y patrones tipo “componente”

Los handlers de bridge son **síncronos** en la frontera con Lua; Wasmoon no resuelve `Promise` automáticamente hacia valores Lua. Patrones recomendados (jobs, host→Lua, composición de chunks) y el spike de comprobación están en [docs/async-subroutines-components.md](docs/async-subroutines-components.md).

