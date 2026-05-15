# Patrón “componente” (props, estado, hooks) sobre Microverse

Este ejemplo **no** añade React al núcleo: solo documenta convenciones que puedes copiar en tu producto.

## Capas

| Capa | Responsabilidad |
|------|-----------------|
| `@microverse/host-surface` | Superficie Zod, capabilities, `mergeEnv`, hooks `workflow:extend()` |
| Tu motor (p. ej. `BusinessScriptingEngine`) | Cuándo cargar chunks, qué allowlist por workflow |
| Este documento | Cómo componer Lua y dónde vive el “estado” |

## Props

- **Host → Lua**: fija `props` antes del chunk del componente (p. ej. segundo `runChunk` que hace `rawset(_ENV, "props", { … })`, o concatena Lua literal al inicio).
- **Tipado LuaLS**: genera alias/clase en tu `.d.lua` o documenta `---@class MyProps` en el prelude. Si el workspace del IDE es la **raíz del monorepo** (no solo `examples/business-scripting-engine/`), LuaLS usa el `.luarc.json` de la raíz del repo, que incluye `workspace.library` → `examples/business-scripting-engine/generated`; el `.luarc.json` dentro del ejemplo aplica cuando abres esa carpeta como workspace único.

## Estado

- **Solo Lua**: tablas locales al chunk (`local state = { … }`) + métodos `W:on…` que mutan `state` (ver `lua/components/stateful_counter.lua`).
- **Host como fuente de verdad**: bridges sync (`store:get` / `store:set`) + estado mínimo en Lua como cache. Async en Lua: `:await()` / callback en bridges (`order_asyncio_tick.lua`). Async vía hook tras trabajo TS (`job_async_partner.lua`) es receta del consumidor — ver `packages/host-surface/docs/async-subroutines-components.md`.

## “Hooks” de ciclo de vida

- Reutiliza los **workflow hooks** definidos con Zod en la superficie (`OrderPlaced`, `InventoryLow`, …): son el análogo más cercano a `useEffect` *externo* (el host dispara el evento).
- Para lógica interna del chunk, usa funciones Lua puras; no hace falta un runtime de hooks en TS.

## Subrutinas / librería compartida

- Prefer **`sharedLuaChunks` al crear el motor** (una vez por hub; cada workflow la recibe en su slot antes de su script):

  ```ts
  new BusinessScriptingEngine(host, {
    sharedLuaChunks: [readWorkflowLua('lib/math_helpers.lua')],
  });
  await engine.registerWorkflow('my-wf', readWorkflowLua('workflows/order_with_math_prelude.lua'), […]);
  ```

- Librerías Lua en runtime: `lua/lib/*.lua` con EmmyLua; tipos de bridges/DTOs en `src/schemas/surface/bridgePayloads.ts` vía `luaType('OrderDto', z.object({…}))` → `generated/businessSurface.d.lua` (CLI).
- **`injectLuaChunks` por workflow** solo para preludes exclusivos de ese workflow (se ejecutan después del shared).

Tras cambiar APIs en `@microverse/microverse`, hay que **reconstruir** ese paquete (`pnpm --filter @microverse/microverse build`): el ejemplo importa su `dist/`.
