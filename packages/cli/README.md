# `@luarizer/cli`

CLI para tareas de **build-time** en proyectos consumidores (p. ej. generar `.d.lua` con anotaciones [LuaCATS](https://luals.github.io/wiki/annotations/) para LuaLS / el IDE).

La lógica de generación vive en **`@luarizer/lua-defs`**: si necesitas llamarla desde código TypeScript (plugins, scripts), usa ese paquete en lugar del binario.

## Instalación

```bash
pnpm add -D @luarizer/cli
```

Tras publicar el paquete, el binario quedará como `luarizer` (equivalente a `npx luarizer` en npm).

En este monorepo:

```bash
pnpm exec luarizer generate-defs --manifest packages/lua-defs/fixtures/example.luarizer.def.json
```

## `generate-defs`

Emite un único fichero `.d.lua` a partir de un **manifiesto JSON** (`LuarizerDefManifest`) que describe:

- **`classes`**: tipos bridge (métodos con `@param` / `@return`).
- **`globals`**: tablas globales que el host inyecta en Lua (p. ej. `Engine` con campos `Input`, `Time`, …).

El manifiesto **no** se infiere automáticamente desde TypeScript hoy: es la capa estable entre tu `buildDeclarativeBridgeTable` (runtime) y lo que quieres que vea el usuario en Lua. Opciones futuras: codegen desde TS, o generar el JSON desde tests de contrato.

Esquema JSON y ejemplo: [packages/lua-defs/schemas/luarizer-def-manifest.schema.json](../lua-defs/schemas/luarizer-def-manifest.schema.json) y [packages/lua-defs/fixtures/example.luarizer.def.json](../lua-defs/fixtures/example.luarizer.def.json).

### Tipos TypeScript del manifiesto

```ts
import type { LuarizerDefManifest } from '@luarizer/lua-defs';

const manifest = { schemaVersion: 1, output: 'gen/sandbox.d.lua', globals: [] } satisfies LuarizerDefManifest;
```

### Uso programático (sin CLI)

```ts
import { generateDefs } from '@luarizer/lua-defs';

await generateDefs({ cwd: process.cwd(), manifestPath: './lua/luarizer.def.json' });
```

Detalle: [packages/lua-defs/README.md](../lua-defs/README.md).

### Script en `package.json` del consumidor

```json
{
  "scripts": {
    "lua:defs": "luarizer generate-defs --manifest ./lua/luarizer.def.json"
  }
}
```

## Bridges y manifiesto

1. **Mantén el manifiesto alineado con lo que inyectas**: mismos nombres de tabla (`Engine.Input`) y firmas que expone tu host al hacer `engine.global.set` / tablas en el entorno del slot.
2. **Versión en CI**: falla el build si el manifiesto no cumple el JSON Schema (podéis validar con `ajv-cli` u otra herramienta).
3. **Roadmap** (fuera de este MVP): leer `DeclarativeBridgeDeclaration[]` en build vía un módulo que exporte un `LuarizerDefManifest` en TS y serialice a JSON, o generar `.d.lua` directamente desde ese objeto.
