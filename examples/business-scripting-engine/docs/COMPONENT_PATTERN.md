# Patrón “componente” (props, estado, hooks) sobre Luarizer

Este ejemplo **no** añade React al núcleo: solo documenta convenciones que puedes copiar en tu producto.

## Capas

| Capa | Responsabilidad |
|------|-----------------|
| `@luarizer/host-surface` | Superficie Zod, capabilities, `mergeEnv`, hooks `workflow:extend()` |
| Tu motor (p. ej. `BusinessScriptingEngine`) | Cuándo cargar chunks, qué allowlist por workflow |
| Este documento | Cómo componer Lua y dónde vive el “estado” |

## Props

- **Host → Lua**: fija `props` antes del chunk del componente (p. ej. segundo `runChunk` que hace `rawset(_ENV, "props", { … })`, o concatena Lua literal al inicio).
- **Tipado LuaLS**: genera alias/clase en tu `.d.lua` o documenta `---@class MyProps` en el prelude. Si el workspace del IDE es la **raíz del monorepo** (no solo `examples/business-scripting-engine/`), LuaLS usa el `.luarc.json` de la raíz del repo, que incluye `workspace.library` → `examples/business-scripting-engine/generated`; el `.luarc.json` dentro del ejemplo aplica cuando abres esa carpeta como workspace único.

## Estado

- **Solo Lua**: tablas locales al chunk (`local state = { … }`) + métodos `W:on…` que mutan `state` (ver `lua/components/stateful_counter.lua`).
- **Host como fuente de verdad**: bridges sync (`store:get` / `store:set`) + estado mínimo en Lua como cache; async del host sigue los patrones de `packages/host-surface/docs/async-subroutines-components.md` (repo raíz).

## “Hooks” de ciclo de vida

- Reutiliza los **workflow hooks** definidos con Zod en la superficie (`OrderPlaced`, `InventoryLow`, …): son el análogo más cercano a `useEffect` *externo* (el host dispara el evento).
- Para lógica interna del chunk, usa funciones Lua puras; no hace falta un runtime de hooks en TS.

## Subrutinas / librería compartida

- Prefer **`registerWorkflow(..., { injectLuaChunks: […] })`** en el motor: el hub ejecuta cada prelude en el mismo slot **antes** del chunk del workflow (misma semántica que un único chunk compuesto).
- Alternativa manual: [`composeLuaChunk`](../src/patterns/composeLuaChunk.ts) concatena strings en un solo `runChunk`. Ejemplo: `workflows/order_with_math_prelude.lua` + `lib/math_helpers.lua`.

Tras cambiar APIs en `@luarizer/luarizer`, hay que **reconstruir** ese paquete (`pnpm --filter @luarizer/luarizer build`): el ejemplo importa su `dist/`.
