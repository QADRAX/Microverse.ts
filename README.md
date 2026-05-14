# Luarizer.ts

Monorepo TypeScript (pnpm + Turborepo + Vite 8) para un ecosistema de **sandbox Lua** con **bridges declarativos**, **capabilities** y runtime Wasmoon, pensado para reutilizar en varios proyectos (por ejemplo un motor de juegos con scripting por entidad).

## Scripts

| Comando | Descripción |
|--------|-------------|
| `pnpm install` | Instala dependencias |
| `pnpm build` | `turbo run build` (cada paquete usa **Vite 8** + `vite-plugin-dts`) |
| `pnpm test` | Vitest en todos los paquetes |
| `pnpm typecheck` | `tsc --noEmit` por paquete |
| `pnpm lint` | ESLint |

## Paquetes (`packages/`)

| Paquete | Rol |
|---------|-----|
| `@luarizer/shared` | `Result`, tipos `UseCase` |
| `@luarizer/runtime-core` | Contratos `SandboxRuntime` / `Sandbox` / `RuntimeAdapter`, `SlotKey`, registro multi-runtime (`IsolatedSandboxRuntimeMap`) |
| `@luarizer/runtime-lua` | Contratos Lua (chunk, valores) |
| `@luarizer/runtime-wasm` | Wasmoon: **un `LuaEngine` por `SandboxRuntime`**, muchos slots vía `createSandbox({ slotKey })` |
| `@luarizer/runtime-bridge` | Tablas bridge, `BridgeCoordinator`, **composición declarativa** (`buildDeclarativeBridgeTable`) |
| `@luarizer/runtime-capabilities` | Allowlists / policies |
| `@luarizer/runtime-zod` | Validación opcional con Zod |
| **`@luarizer/luarizer`** | **Fachada publicada**: un solo `dependencies` en apps; re-exporta runtime + `Luarizer.createWasmRuntime()` |
| **`@luarizer/integration-examples`** | **Solo privado en el monorepo**: ejemplos y tests que importan únicamente `@luarizer/luarizer` (consumidor final) |
| **`@luarizer/lua-defs`** | Generación programática de `.d.lua` (LuaCATS) desde el manifiesto JSON (`generateDefs`, tipos) |
| **`@luarizer/cli`** | CLI **`luarizer`** (`generate-defs`): mismo resultado que `lua-defs`, orientado a **scripts de shell** en build time |

Las capas siguen `domain` / `application` / `infrastructure` (`presentation` solo en apps).

## Definiciones Lua para el IDE (`.d.lua`)

En el proyecto del consumidor, añade un script de build que ejecute `luarizer generate-defs` o importe `generateDefs` desde `@luarizer/lua-defs`, con un manifiesto JSON alineado con tus bridges inyectados. Guía: [docs/cli-lua-definitions.md](docs/cli-lua-definitions.md), [packages/lua-defs/README.md](packages/lua-defs/README.md) y [packages/cli/README.md](packages/cli/README.md).

## Consumo como dependencia única

En el `package.json` de tu app (fuera del monorepo, cuando publiques los paquetes):

```json
"dependencies": {
  "@luarizer/luarizer": "workspace:*"
}
```

Importa desde `@luarizer/luarizer` (API agregada). El paquete `@luarizer/integration-examples` en este repo actúa como **contrato de consumo**: sus módulos `*.example.ts` y tests **no** importan `@luarizer/runtime-*` directamente.

Checklist frente a `@duckengine/scripting-lua`: [docs/scripting-lua-parity.md](docs/scripting-lua-parity.md).

## Un VM, muchos slots (modelo nativo)

- **`createWasmSandboxRuntime()`** devuelve un `SandboxRuntime` que posee **un** Wasmoon/Lua compartido.
- Llama **`createSandbox`** varias veces para registrar tantos scripts como necesites.
- Pasa **`slotKey`** (tipo `SlotKey` / `SandboxId`, p. ej. `createSlotKey('entity::script')`) para una clave estable; si lo omites, se genera un id aleatorio (sigue siendo un slot distinto en el mismo VM).
- Cada slot ejecuta con `load(..., "t", env)` y un **entorno Lua propio** (globales de usuario no se mezclan entre slots; los builtins siguen vía `__index` a `_G`).
- **`sandbox.dispose()`** invoca `disposeSandbox` en el adaptador y libera el entorno de ese slot en Lua.

## Varios motores Lua (N VMs)

Si necesitas **procesos Lua totalmente separados** (otro mundo, otro worker, otro tenant), crea **varias instancias** de `SandboxRuntime` (p. ej. una por worker). Para indexarlas en TS puedes usar **`IsolatedSandboxRuntimeMap`** (`@luarizer/runtime-core`).

**Ventajas:** aislamiento máximo entre runtimes. **Coste:** más memoria y más arranques Wasmoon/Lua.

## Bridges declarativos

Para construir tablas `nombre → API` que luego inyectas en Lua (sin acoplar al motor), usa `buildDeclarativeBridgeTable` y `DeclarativeBridgeDeclaration` (desde `@luarizer/luarizer` o `@luarizer/runtime-bridge`).

## Documentación adicional

- [docs/cli-lua-definitions.md](docs/cli-lua-definitions.md) — generación de `.d.lua` (LuaCATS) con `@luarizer/cli` o `@luarizer/lua-defs` en build time.
- [docs/optional-shared-vm-lua-abi.md](docs/optional-shared-vm-lua-abi.md) — bootstrap Lua actual (`__luarizer_*`) y extensión futura (hooks, props).
- [docs/duckstyle-emulation-vs-scripting-lua.md](docs/duckstyle-emulation-vs-scripting-lua.md) — análisis Duck `core-v2` + `scripting-lua` vs Luarizer; emulación en `integration-examples`.
- [docs/shared-vm-roadmap.md](docs/shared-vm-roadmap.md) — mejoras opcionales encima del modelo multi-slot nativo.
