import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  buildLuaCatsDocument,
  generateDefs,
  surfaceSpecToLuaDefManifest,
  writeSurfaceSpecFile,
  type Lua1TypeOverlay,
} from '@microverse.ts/lua-defs';
import { parseSurfaceSpecJson, type SurfaceSpecDocument } from '@microverse.ts/surface-spec';

export const CODEGEN_COMMAND = 'codegen' as const;

type HostSurfaceLike = {
  readonly document?: SurfaceSpecDocument | undefined;
  readonly toProtocolJson?: () => SurfaceSpecDocument;
  readonly toLuaDefManifest?: (opts: {
    readonly output: string;
    readonly headerNote?: string | undefined;
    readonly luaTypeAliases?: Readonly<Record<string, string>> | undefined;
    readonly luaTypeOverlay?: Lua1TypeOverlay | undefined;
  }) => unknown;
};

function isHostSurfaceLike(v: unknown): v is HostSurfaceLike {
  if (typeof v !== 'object' || v === null) {
    return false;
  }
  return (
    'document' in v ||
    typeof Reflect.get(v, 'toProtocolJson') === 'function' ||
    typeof Reflect.get(v, 'toLuaDefManifest') === 'function'
  );
}

async function loadSurfaceModule(absPath: string): Promise<Record<string, unknown>> {
  const href = pathToFileURL(absPath).href;
  if (absPath.endsWith('.ts') || absPath.endsWith('.mts')) {
    const { tsImport } = await import('tsx/esm/api');
    return (await tsImport(href, href)) as Record<string, unknown>;
  }
  return (await import(href)) as Record<string, unknown>;
}

function resolveDocument(surface: HostSurfaceLike): SurfaceSpecDocument {
  if (surface.document !== undefined) {
    return surface.document;
  }
  if (typeof surface.toProtocolJson === 'function') {
    return surface.toProtocolJson();
  }
  throw new Error('Surface must expose `document` or `toProtocolJson()`');
}

function resolveOutDir(flags: ReadonlyMap<string, string | true>): string {
  const outDirFlag = flags.get('out-dir');
  return typeof outDirFlag === 'string' && outDirFlag.length > 0 ? outDirFlag : 'generated';
}

function resolveHeaderNote(flags: ReadonlyMap<string, string | true>): string | undefined {
  const headerFlag = flags.get('header-note');
  return typeof headerFlag === 'string' && headerFlag.length > 0 ? headerFlag : undefined;
}

async function writeLuaFromManifest(
  cwd: string,
  manifestPath: string,
  outPath: string | undefined,
): Promise<string> {
  const { written } = await generateDefs({ cwd, manifestPath, outPath });
  return resolve(written);
}

async function writeLuaFromSurfaceSpec(
  cwd: string,
  doc: SurfaceSpecDocument,
  luaRel: string,
  headerNote: string | undefined,
  surfaceRaw?: HostSurfaceLike,
): Promise<string> {
  const manifest =
    surfaceRaw !== undefined && typeof surfaceRaw.toLuaDefManifest === 'function'
      ? surfaceRaw.toLuaDefManifest({ output: luaRel, headerNote })
      : surfaceSpecToLuaDefManifest(doc, { output: luaRel, headerNote });
  const body = buildLuaCatsDocument(manifest as Parameters<typeof buildLuaCatsDocument>[0]);
  const luaWritten = resolve(cwd, luaRel);
  await mkdir(dirname(luaWritten), { recursive: true });
  await writeFile(luaWritten, body, 'utf8');
  return luaWritten;
}

/**
 * Build-time codegen: SurfaceSpec JSON + LuaCATS `.d.lua` (or legacy manifest-only path).
 */
export async function runCodegen(
  cwd: string,
  flags: ReadonlyMap<string, string | true>,
): Promise<string> {
  const surfacePath = flags.get('surface');
  const specPath = flags.get('spec') ?? flags.get('surface-json');
  const manifestPath = flags.get('manifest');
  const outPath = flags.get('out');
  const outDir = resolveOutDir(flags);
  const headerNote = resolveHeaderNote(flags);

  const sources = [surfacePath, specPath, manifestPath].filter(
    (p): p is string => typeof p === 'string' && p.length > 0,
  );
  if (sources.length !== 1) {
    throw new Error(
      'Provide exactly one of: --surface <path.ts>  |  --spec <path.surface.json>  |  --manifest <path.json>',
    );
  }

  if (typeof manifestPath === 'string' && manifestPath.length > 0) {
    const out =
      typeof outPath === 'string' && outPath.length > 0 ? outPath : undefined;
    return writeLuaFromManifest(cwd, manifestPath, out);
  }

  if (typeof specPath === 'string' && specPath.length > 0) {
    const raw = await readFile(resolve(cwd, specPath), 'utf8');
    const doc = parseSurfaceSpecJson(raw);
    const stem = basename(specPath, extname(specPath)).replace(/\.surface$/, '');
    const luaRel =
      typeof outPath === 'string' && outPath.length > 0
        ? outPath
        : join(outDir, `${stem}.d.lua`);
    return writeLuaFromSurfaceSpec(cwd, doc, luaRel, headerNote);
  }

  const absSurface = resolve(cwd, surfacePath as string);
  const mod = await loadSurfaceModule(absSurface);
  const surfaceRaw = mod.default;
  if (!isHostSurfaceLike(surfaceRaw)) {
    throw new Error(
      'The --surface module must default-export a compiled host surface (`.build()` result).',
    );
  }

  const stem = basename(absSurface, extname(absSurface));
  const specRel = join(outDir, `${stem}.surface.json`);
  const luaRel =
    typeof outPath === 'string' && outPath.length > 0
      ? outPath
      : join(outDir, `${stem}.d.lua`);

  const doc = resolveDocument(surfaceRaw);

  await writeSurfaceSpecFile({ cwd, relativePath: specRel, document: doc });
  const luaWritten = await writeLuaFromSurfaceSpec(cwd, doc, luaRel, headerNote, surfaceRaw);
  return `${resolve(cwd, specRel)} and ${luaWritten}`;
}

export function printCodegenHelp(bin: string): void {
  const lines = [
    `${CODEGEN_COMMAND}   Emit SurfaceSpec JSON + LuaCATS .d.lua (build-time)`,
    '',
    'From TypeScript host surface (recommended):',
    `  ${bin} ${CODEGEN_COMMAND} --surface <path/to/surface.ts> [--out-dir generated] [--out <path.d.lua>] [--header-note <text>]`,
    '',
    '  Writes <out-dir>/<basename>.surface.json and <out-dir>/<basename>.d.lua',
    '  (--out overrides only the .d.lua path)',
    '',
    'From SurfaceSpec JSON (regenerate .d.lua only):',
    `  ${bin} ${CODEGEN_COMMAND} --spec <path.surface.json> [--out-dir generated] [--out <path>]`,
    '',
    'Legacy LuaDefManifest JSON:',
    `  ${bin} ${CODEGEN_COMMAND} --manifest <path/to/manifest.json> [--out <path>]`,
    '',
  ];
  process.stderr.write(`${lines.join('\n')}\n`);
}
