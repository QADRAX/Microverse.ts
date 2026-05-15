# Host async, subrutinas y “componentes” (genérico vs aplicación)

Este documento fija **decisiones de arquitectura** para consumidores de `@luarizer/host-surface` / Wasm sin acoplar React ni async al núcleo.

## 1. Bridges async explícitos (Wasmoon + `@luarizer/runtime-wasm`)

Los tests de interop básicos viven en `@luarizer/runtime-wasm`:

- `src/infrastructure/runtime/WasmoonAsyncInterop.spike.test.ts`
- `src/infrastructure/runtime/asyncBridgeExplicit.integration.test.ts`

**Comportamiento de Wasmoon (`injectObjects: true`):**

- Si un handler JS devuelve un **`Promise`**, Lua recibe un **handle** con `:await()` (userdata/tabla envuelta por el bootstrap). **No** hay auto-await: `asyncio:tick({ ... })` sin `:await()` no es el resultado Zod.
- **Bloqueo explícito:** `local r = asyncio:tick({ delayMs = 5, seed = 1 }):await()`
- **Continuación (2º argumento):** `asyncio:tick({ ... }, function(r) … end)` — el callback se ejecuta al **final del chunk** en el slot (tras el resto del script del mismo `run`), no en paralelo real.
- En **TypeScript**, `createBridgeDeclarationsFromHostSurfaceSpec` acepta `handler` que devuelve `TOut | Promise<TOut>`: si el resultado es *thenable*, la validación Zod de `output` se aplica **al valor resuelto** antes de devolver el Promise a Wasmoon.

**Manifest (`fn` + `async function`):** `@luarizer/host-surface` marca métodos `async` en define-time, emite `AsyncioTickHandle` + parámetro opcional `onComplete` y `await` en `.d.lua` generado.

## 2. Hooks de workflow ≠ async del engine

| Mecanismo | Dirección | Rol |
|-----------|-----------|-----|
| **Bridges** | Lua → host | Sync o async explícito (`:await()`, callback 2º arg) |
| **Workflow hooks** | Host → Lua | Dispatch genérico: el host re-entra al slot y llama `W:on…(evt)` |

El patrón `jobs:create` sync + host hace I/O + `emitWorkflowHook('JobDone', …)` (ver `examples/business-scripting-engine/lua/workflows/job_async_partner.lua`) es una **receta del consumidor**, no la forma “normal” del motor para async. Luarizer no correlaciona jobs ni sustituye bridges Promise.

## 3. Otras formas de modelar I/O (aplicación)

### A) Fachada síncrona + estado ya materializado

El handler solo lee memoria/cache que **otro** código TS actualiza tras `await` fuera del bridge.

### B) Job / correlación (solicitud + consulta)

- Bridge sync `jobs:start` → `jobId` + `pending`.
- Bridge sync `jobs:status` → `done` + resultado cuando el host termine.

Útil si quieres evitar bridges Promise; sigue siendo responsabilidad de tu host.

## 4. Subrutinas (reutilizar Lua)

| Estrategia | Cuándo usarla |
|------------|----------------|
| **`sharedLuaChunks` en el hub** | Lua compartido antes de cada workflow (ver ejemplo `math_helpers.lua`). |
| **`injectLuaChunks` por workflow** | Prelude solo de ese workflow. |
| **Varios `runChunk` en el mismo slot** | El `_ENV` del slot persiste entre ejecuciones. |
| **`require` / FS en Lua** | Solo con extensión explícita del runtime (riesgo); no contrato mínimo. |

## 5. “Componentes” estilo React

**No** forman parte del núcleo. Ver `examples/business-scripting-engine/docs/COMPONENT_PATTERN.md`.

## 6. Scripts simples vs modelado rico

El núcleo se mantiene: **sandbox + capabilities + Zod + hooks opcionales + async bridge explícito**.
