import { basename, extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  generateDefs,
  writeLuaDefinitionsFromManifest,
  type LuaDefManifest,
} from '@microverse.ts/lua-defs';

export const GENERATE_LUA_DEFS_COMMAND = 'generate-lua-defs' as const;

type HostSurfaceLike = {
  readonly toLuaDefManifest: (opts: {
    readonly output: string;
    readonly headerNote?: string | undefined;
    readonly luaTypeAliases?: Readonly<Record<string, string>> | undefined;
  }) => LuaDefManifest;
};

function isHostSurfaceLike(v: unknown): v is HostSurfaceLike {
  if (typeof v !== 'object' || v === null || !('toLuaDefManifest' in v)) {
    return false;
  }
  return typeof Reflect.get(v, 'toLuaDefManifest') === 'function';
}

async function loadSurfaceModule(absPath: string): Promise<Record<string, unknown>> {
  const href = pathToFileURL(absPath).href;
  if (absPath.endsWith('.ts') || absPath.endsWith('.mts')) {
    const { tsImport } = await import('tsx/esm/api');
    return (await tsImport(href, href)) as Record<string, unknown>;
  }
  return (await import(href)) as Record<string, unknown>;
}

/**
 * Emit LuaCATS `.d.lua` from a JSON manifest or a TypeScript host surface module.
 */
export async function runGenerateLuaDefs(
  cwd: string,
  flags: ReadonlyMap<string, string | true>,
): Promise<string> {
  const manifestPath = flags.get('manifest');
  const surfacePath = flags.get('surface');
  const hasManifest = typeof manifestPath === 'string' && manifestPath.length > 0;
  const hasSurface = typeof surfacePath === 'string' && surfacePath.length > 0;

  if (hasManifest === hasSurface) {
    throw new Error('Provide exactly one of: --manifest <path.json>  OR  --surface <path.ts|js>');
  }

  const outFlag = flags.get('out');
  const outPath = typeof outFlag === 'string' && outFlag.length > 0 ? outFlag : undefined;

  if (hasManifest) {
    const { written } = await generateDefs({
      cwd,
      manifestPath: manifestPath as string,
      outPath,
    });
    return resolve(written);
  }

  const absSurface = resolve(cwd, surfacePath as string);
  const mod = await loadSurfaceModule(absSurface);

  const surfaceRaw = mod.default;
  if (!isHostSurfaceLike(surfaceRaw)) {
    throw new Error(
      'The --surface module must default-export a host surface (result of defineHostSurface(...)).',
    );
  }

  const stem = basename(absSurface, extname(absSurface));
  const outputRel = outPath ?? join('generated', `${stem}.d.lua`);

  const headerFlag = flags.get('header-note');
  const headerNote =
    typeof headerFlag === 'string' && headerFlag.length > 0 ? headerFlag : undefined;

  const manifest = surfaceRaw.toLuaDefManifest({
    output: outputRel,
    headerNote,
  });
  const { written } = writeLuaDefinitionsFromManifest({
    cwd,
    manifest,
  });
  return resolve(written);
}

export function printGenerateLuaDefsHelp(bin: string): void {
  const lines = [
    `${GENERATE_LUA_DEFS_COMMAND}   Emit LuaCATS .d.lua (Lua Language Server stubs)`,
    '',
    'From JSON manifest (hand-authored or CI-exported):',
    `  ${bin} ${GENERATE_LUA_DEFS_COMMAND} --manifest <path/to/manifest.json> [--out <path>]`,
    '',
    'From TypeScript host surface (fluent defineHostSurfaceFor; default export only):',
    `  ${bin} ${GENERATE_LUA_DEFS_COMMAND} --surface <path/to/surface.ts|js> [--out <path>] [--header-note <text>]`,
    '',
    '  The module must `export default` the compiled surface (`.build()` result).',
    '  If --out is omitted, writes generated/<surfaceBasename>.d.lua.',
    '  .ts surfaces are loaded via tsx (bundled with this CLI).',
    '',
  ];
  process.stderr.write(`${lines.join('\n')}\n`);
}
