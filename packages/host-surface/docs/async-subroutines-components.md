# Host async, subrutinas y “componentes” (genérico vs aplicación)

Este documento fija **decisiones de arquitectura** para consumidores de `@luarizer/host-surface` / Wasm sin acoplar React ni async al núcleo.

## 1. Promesas en handlers de bridge (Wasmoon + `@luarizer/runtime-wasm`)

Los tests de interop básicos viven en `@luarizer/runtime-wasm`:

- `src/infrastructure/runtime/WasmoonAsyncInterop.spike.test.ts`

**Comportamiento de Wasmoon (`injectObjects: true`):**

- Si un handler JS devuelve un **`Promise`**, Lua recibe primero un **userdata** con método `:await()` (no un `number` / `table` directamente).
- El bootstrap de slots `LUARIZER_SLOT_VM_BOOTSTRAP_LUA` envuelve cada tabla-bridge **userdata** y, tras cada llamada a método, aplica `:await()` cuando exista, de modo que el Lua de negocio puede seguir escribiendo `asyncio:tick({ ... })` y recibir el valor ya resuelto.
- En **TypeScript**, `createBridgeDeclarationsFromHostSurfaceSpec` acepta `handler` que devuelve `TOut | Promise<TOut>`: si el resultado es *thenable*, la validación Zod de `output` se aplica **al valor resuelto** antes de devolver el Promise a Wasmoon.

**Hooks de workflow** (`emitToAllWorkflows`, p. ej. `JobDone`) siguen siendo útiles cuando el host quiere **empujar** un evento que no encaja en “una llamada a bridge = un resultado”.

## 2. Patrones recomendados para I/O async (sin romper Lua)

### A) Fachada síncrona + estado ya materializado

El handler solo lee memoria/cache/servicios que **otro** código TS actualiza tras `await` fuera del bridge. Lua solo ve snapshots consistentes.

### B) Job / correlación (solicitud + consulta)

- Bridge sync `jobs:start` → devuelve `jobId` + estado `pending`.
- Bridge sync `jobs:status` → devuelve `done` + resultado cuando el host haya terminado el trabajo async.
- Lua puede consultar en bucle o combinar con el patrón C.

### C) Host async → notificación a Lua (preferido para “reaccionar cuando termine”)

1. Lua solo dispara la intención con bridges sync (p. ej. `orders:requestRefresh`).
2. El host ejecuta I/O async en TypeScript.
3. Al terminar, el host **vuelve a entrar al sandbox** con un hook adicional definido en la superficie (Zod + método `on…` en Lua), por ejemplo `emitToAllWorkflows('JobDone', { jobId, result })` (ver `examples/business-scripting-engine`: `emitWorkflowHook` + `workflows/job_async_partner.lua`).

Mantiene el modelo **Lua → host** (bridges) y **host → Lua** (hooks / chunks) ya existente.

## 3. Subrutinas (reutilizar Lua)

Opciones **genéricas** sin `require` de ficheros en el VM por defecto:

| Estrategia | Cuándo usarla |
|------------|----------------|
| **Composición en TypeScript** | Concatenar o plantillar cadenas (prelude común + cuerpo) antes de `runChunk` / `registerWorkflow`, o pasar `injectLuaChunks` al hub para varios preludes en el mismo slot. |
| **Varios `runChunk` en el mismo slot** | El `_ENV` del slot persiste; primer chunk define helpers globales en el slot, el segundo carga la lógica. |
| **`require` / FS en Lua** | Solo con extensión explícita del runtime (riesgo y superficie de ataque); no forma parte del contrato mínimo. |

## 4. “Componentes” estilo React (props, estado, hooks)

**No** forman parte del núcleo genérico. Se modelan en **tu aplicación** o en ejemplos encima de:

- `workflow:extend()` + hooks Zod en la superficie (host → Lua).
- Tablas Lua `props` / `state` inyectadas vía `_ENV` (segundo chunk o `rawset` desde un bridge `component:init` que definas tú).
- “Hooks” de estado: **Lua puro** (closures/tablas) o bridges adicionales si necesitas persistencia en el host.

Ver el ejemplo en `examples/business-scripting-engine/docs/COMPONENT_PATTERN.md` y `src/patterns/composeLuaChunk.ts`.

## 5. Scripts simples vs modelado rico

- **Simple**: un chunk + allowlist mínima.
- **Rico**: más métodos en `defineHostSurface`, más hooks Zod, misma tubería.

El núcleo se mantiene: **sandbox + capabilities + Zod + hooks opcionales**.
