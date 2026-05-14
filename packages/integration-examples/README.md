# `@luarizer/integration-examples`

Paquete **solo de monorepo** (`private: true`). No lo publiques como producto.

- Cada archivo `*.example.ts` bajo `src/infrastructure/examples/` es un **ejemplo reutilizable** (funciones exportadas).
- Los tests en `*.test.ts` importan **solo** `@luarizer/luarizer`, igual que una app externa con una dependencia en `package.json`.

Añade más escenarios creando un nuevo `*.example.ts` y un bloque `describe` en un `*.test.ts` (o un test dedicado por ejemplo).

## Carpeta `duckstyle-emulation/`

Emula la **forma** de `core-v2` (`createSceneSubsystem`) + `scripting-lua` (sesión, slots, `runHookOnAllSlots`) usando solo `@luarizer/luarizer`. Documentación de arquitectura: `docs/duckstyle-emulation-vs-scripting-lua.md` en la raíz del monorepo.
