# `@microverse.ts/lua-defs`

Biblioteca TypeScript para **generar ficheros `.d.lua`** (anotaciones [LuaCATS](https://luals.github.io/wiki/annotations/)) a partir de un **manifiesto** (`LuaDefManifest`), sin pasar por el binario `microverse`.

Úsala cuando quieras integrar la generación en un script de build, un plugin de Vite/Rollup, o cualquier herramienta Node que ya tenga TypeScript. Para construir el manifiesto desde TypeScript (Zod + capabilities), usa [`@microverse.ts/host-surface`](../host-surface/README.md).

## Instalación

```bash
pnpm add -D @microverse.ts/lua-defs
```

## Arquitectura (clean / capas)

El código bajo `src/` sigue el mismo criterio que el resto del monorepo (`eslint-plugin-boundaries`):

| Capa | Ruta | Contenido |
|------|------|-------------|
| **Dominio** | `src/domain/` | Tipos del manifiesto, `parseManifestJson`, generación pura `buildLuaCatsDocument`. |
| **Aplicación** | `src/application/` | Puertos (`ports/`) y caso de uso `generateLuaDefinitionsFile` (`useCases/`). |
| **Infraestructura** | `src/infrastructure/` | Adaptador Node (`createNodeFileSystemPort`), `generateDefs` y el **barrel público** `publicApi.ts`. |

El entry del paquete (`src/index.ts`) solo re-exporta `infrastructure/publicApi.ts`: ahí están las funciones que usará el consumidor (más tipos y el caso de uso si quieres inyectar dependencias en tests).

## API

- **`parseManifestJson(raw: string)`** — parsea y valida mínimamente el JSON del manifiesto.
- **`buildLuaCatsDocument(manifest)`** / **`emitLuaCatsFromManifest(manifest)`** (alias) — devuelve el contenido `.d.lua` como `string`.
- **`generateDefs({ cwd, manifestPath, outPath? })`** — lee el fichero del manifiesto, escribe el `.d.lua` (crea directorios si hace falta). `outPath` opcional sustituye a `manifest.output`.
- **`loadLuaDefinitionsFromManifestFile({ cwd, manifestPath })`** — lee el manifiesto desde disco y devuelve el contenido `.d.lua` como `string` (no escribe fichero).
- **`generateLuaDefinitionsFile(ports, input)`** / **`loadLuaDefinitionsDocumentFromManifestFile(ports, input)`** — casos de uso alineados con `AsyncUseCase` de `@microverse.ts/shared` (tipos explícitos `GenerateLuaDefinitionsFileUseCase` y `LoadLuaDefinitionsDocumentFromManifestFileUseCase`). El tuple de puertos es `[fs, parseManifest, buildLuaCatsDocument]` (ver `LuaDefinitionsFromManifestFilePorts` y `createDefaultLuaDefinitionsFromManifestFilePorts()`).

```ts
import { readFile } from 'node:fs/promises';

import { emitLuaCatsFromManifest, generateDefs, parseManifestJson } from '@microverse.ts/lua-defs';

await generateDefs({
  cwd: process.cwd(),
  manifestPath: 'lua/microverse.def.json',
});

const manifest = parseManifestJson(await readFile('lua/microverse.def.json', 'utf8'));
const lua = emitLuaCatsFromManifest(manifest);
```

## Esquema y ejemplo

- [schemas/lua-def-manifest.schema.json](./schemas/lua-def-manifest.schema.json)
- [fixtures/example.lua.def.json](./fixtures/example.lua.def.json)

For the command line, use [`@microverse.ts/cli`](../cli/README.md) (`microverse codegen`).
