# Paridad con `@duckengine/scripting-lua` (SpaceDucks v2)

Este documento lista **qué cubre Luarizer hoy** frente al paquete de referencia `packages/v2/scripting-lua` y **qué falta** para una reescritura seria. No modifica SpaceDucks: sirve como checklist en Luarizer.

## Qué es `scripting-lua` hoy (resumen)

- **Dominio**: ports (`ScriptSandbox`, …), schemas, properties, component accessors, slots, session, bridges declarativos.
- **Aplicación**: ciclo de motor — `reconcileSlots`, `destroyEntitySlots`, `runEarlyUpdate` / `runUpdate` / `runLateUpdate` / `runPreRender` / `runPostRender`, `teardownSession`.
- **Infraestructura**: `createScriptingSubsystem`, Wasmoon (`createWasmoonSandbox`, módulos Lua embebidos), assets generados (`BuiltInScripts`, …).
- **Acoplamiento**: `@duckengine/core-v2` (ECS, diagnósticos, ids de entidad, etc.).

## Qué cubre Luarizer hoy

| Área | Estado |
|------|--------|
| Un VM Wasmoon por `SandboxRuntime`, varios slots (`createSandbox` + `slotKey`) | Implementado (`@luarizer/runtime-wasm`) |
| Entorno Lua por slot (`load` + `__index = _G`) | Bootstrap `__luarizer_*` |
| Contratos `Sandbox` / `SandboxRuntime` / `RuntimeAdapter` + `disposeSandbox` | `@luarizer/runtime-core` |
| Bridges declarativos TS (`buildDeclarativeBridgeTable`) | `@luarizer/runtime-bridge` |
| Capabilities / políticas | `@luarizer/runtime-capabilities` |
| Validación opcional Zod | `@luarizer/runtime-zod` |
| Varios runtimes aislados (`IsolatedSandboxRuntimeMap`) | `@luarizer/runtime-core` |
| Fachada única para consumidores | `@luarizer/luarizer` |
| Ejemplos + pruebas estilo consumidor | `@luarizer/integration-examples` |

## Huecos / placeholders relevantes para migrar `scripting-lua`

### 1. Ciclo de vida del motor (hooks por nombre)

- **scripting-lua**: `runUpdate`, `runEarlyUpdate`, … despachan hooks por slot.
- **Luarizer**: hoy solo `sandbox.run({ script })` (chunk); no hay registro tipo `__LoadSlot` / tabla de hooks ni despacho `hookName + dt`.

**Siguiente paso sugerido:** extender bootstrap Lua + API TS (`loadScript`, `invokeHook`) o capa `application` en un paquete nuevo tipo `@luarizer/runtime-host` (sin ECS).

### 2. Propiedades y sincronización TS ↔ Lua

- **scripting-lua**: hidratación, dirty flush, schemas por propiedad.
- **Luarizer**: no implementado.

### 3. Puentes inyectados en Lua

- **scripting-lua**: tablas bridge por slot en el entorno Lua / proxies.
- **Luarizer**: composición TS lista; **inyección en el env del chunk** y contrato Lua estable aún no definidos en código.

### 4. Seguridad y scripts de sistema

- **scripting-lua**: cadena `sandbox_security` → metatables → runtime → extensiones.
- **Luarizer**: solo bootstrap mínimo de slots; sin hardening de `_G` ni metatables de juego.

### 5. Diagnósticos y errores por fase

- **scripting-lua**: `DiagnosticPort`, fases `compile` / `load` / `hook`.
- **Luarizer**: `ExecutionFailure` genérico + logs en `executeScript`; sin modelo equivalente.

### 6. Worker / hilo dedicado

- **Luarizer**: `WorkerSandboxHost` y mensajes son **placeholder** (no ejecutan Wasmoon en worker).

### 7. Codegen y assets

- **scripting-lua**: `BuiltInScripts`, generación de tipos de componentes / inputs.
- **Luarizer**: sin pipeline de generación; Lua embebido solo el bootstrap de slots en wasm.

### 8. Subsistema “listo para enchufar”

- **scripting-lua**: `createScriptingSubsystem` orquesta sesión + ECS.
- **Luarizer**: piezas atómicas + `@luarizer/luarizer`; la orquestación queda en el juego o en un futuro paquete host sin `core-v2`.

### 9. Tests de contrato Lua

- Ampliar pruebas sobre globales `__luarizer_*`, orden de dispose, y futuros hooks.

Ver también la **emulación ejecutable** (solo `@luarizer/luarizer`): `packages/integration-examples/src/infrastructure/examples/duckstyle-emulation/` y [duckstyle-emulation-vs-scripting-lua.md](./duckstyle-emulation-vs-scripting-lua.md).

## Cómo usar este doc

1. Priorizar **hooks + load por slot** si el objetivo es sustituir el flujo de `runUpdate`.
2. Mantener **ECS y bridges de motor** en SpaceDucks o en un adaptador fino que use `@luarizer/luarizer` solo como motor Lua.
