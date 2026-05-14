# Definiciones Lua (`.d.lua`) en build time

Luarizer no ejecuta Lua en el IDE: los consumidores (motores tipo Duck) necesitan **anotaciones LuaCATS** para que LuaLS / el editor ofrezcan autocompletado en scripts del sandbox.

## Encaje en el monorepo

| Pieza | Rol |
|-------|-----|
| **`@luarizer/cli`** | Binario `luarizer`, comando `generate-defs`. |
| **`@luarizer/lua-defs`** | Misma generación **desde TypeScript** (`generateDefs`, `loadLuaDefinitionsFromManifestFile`, `emitLuaCatsFromManifest`, tipos del manifiesto). |
| **Manifiesto JSON** (`LuarizerDefManifest`) | Contrato versionado (`schemaVersion: 1`) entre tu host TypeScript y el `.d.lua` generado. |
| **JSON Schema** (`packages/lua-defs/schemas/luarizer-def-manifest.schema.json`) | Validación en CI / autocompletado en el editor al editar el manifiesto. |

La generación es **puramente declarativa**: ni el CLI ni la librería inspeccionan tus `DeclarativeBridgeDeclaration` en TS (eso sería un paso opcional futuro vía un script tuyo que serialice a JSON).

## Bridges

Hoy el flujo recomendado es:

1. **Runtime**: sigues componiendo bridges con `buildDeclarativeBridgeTable` (o tablas manuales).
2. **Tipos Lua**: mantienes un manifiesto (`lua/luarizer.def.json`) con las **mismas** claves y firmas que inyectas en el entorno Lua (`Engine`, `self.bridges`, etc.).
3. **Build**: o bien `luarizer generate-defs --manifest lua/luarizer.def.json`, o bien `generateDefs({ cwd, manifestPath })` desde `@luarizer/lua-defs`, escribiendo `generated/sandbox.d.lua` (ruta `output` del manifiesto o `--out` / `outPath`), o `loadLuaDefinitionsFromManifestFile` si solo necesitas el contenido en memoria (string).

Así evitas deriva entre runtime y tipos: el manifiesto es el “contrato de superficie” revisable en PR.

### Evolución posible

- Exportar desde tu repo un `manifest.json` generado por un script TS que recorra tus declaraciones (convención de nombres + tipos literales).
- Añadir en Luarizer helpers TS que construyan `LuarizerDefManifest` desde listas tipadas (sin reflexión completa).

## Uso

CLI:

```bash
pnpm add -D @luarizer/cli
pnpm exec luarizer generate-defs --manifest ./lua/luarizer.def.json
```

Programático (Node / build scripts):

```bash
pnpm add -D @luarizer/lua-defs
```

```ts
import { generateDefs, loadLuaDefinitionsFromManifestFile } from '@luarizer/lua-defs';

await generateDefs({ cwd: process.cwd(), manifestPath: './lua/luarizer.def.json' });

const lua = await loadLuaDefinitionsFromManifestFile({
  cwd: process.cwd(),
  manifestPath: './lua/luarizer.def.json',
});
```

Detalle del manifiesto: [packages/lua-defs/README.md](../packages/lua-defs/README.md) y [packages/cli/README.md](../packages/cli/README.md).
