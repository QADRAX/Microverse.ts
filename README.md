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

Las capas siguen `domain` / `application` / `infrastructure` (`presentation` solo en apps).

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

Para construir tablas `nombre → API` que luego inyectas en Lua (sin acoplar al motor), usa `buildDeclarativeBridgeTable` desde `@luarizer/runtime-bridge` junto con `DeclarativeBridgeDeclaration` (patrón similar a “una declaración por bridge + factory”).

## Documentación adicional

- [docs/optional-shared-vm-lua-abi.md](docs/optional-shared-vm-lua-abi.md) — bootstrap actual y extensión futura (hooks, props).
- [docs/shared-vm-roadmap.md](docs/shared-vm-roadmap.md) — mejoras opcionales encima del modelo multi-slot nativo.
