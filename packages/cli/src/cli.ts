#!/usr/bin/env node
import { basename, extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  generateDefs,
  writeLuaDefinitionsFromManifest,
  type LuarizerDefManifest,
} from '@luarizer/lua-defs';

function printHelp(): void {
  const lines = [
    'luarizer — tooling for Luarizer Lua sandboxes',
    '',
    'Commands:',
    '  generate-defs   Emit LuaCATS .d.lua',
    '',
    'Usage (JSON manifest — for hand-authored or CI-exported manifests):',
    '  luarizer generate-defs --manifest <path/to/manifest.json> [--out <path>]',
    '',
    'Usage (TypeScript host surface — Zod + defineHostSurface; default export only):',
    '  luarizer generate-defs --surface <path/to/surface.ts|js> [--out <path>] [--header-note <text>]',
    '',
    '  The module must `export default` the value from `defineHostSurface({...})`.',
    '  If --out is omitted, writes generated/<surfaceBasename>.d.lua (basename without extension).',
    '  .ts surfaces are loaded via tsx (bundled with this CLI).',
    '',
    '  --out   Optional; overrides the default output path above',
    '',
  ];
  process.stderr.write(`${lines.join('\n')}\n`);
}

function parseArgs(argv: readonly string[]): {
  readonly command: string | undefined;
  readonly flags: ReadonlyMap<string, string | true>;
} {
  const flags = new Map<string, string | true>();
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === undefined) {
      continue;
    }
    if (a === '--help' || a === '-h') {
      flags.set('help', true);
      continue;
    }
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('-')) {
        flags.set(key, next);
        i += 1;
      } else {
        flags.set(key, true);
      }
      continue;
    }
    positional.push(a);
  }
  return { command: positional[0], flags };
}

type HostSurfaceLike = {
  readonly toLuarizerDefManifest: (opts: {
    readonly output: string;
    readonly headerNote?: string | undefined;
    readonly luaTypeAliases?: Readonly<Record<string, string>> | undefined;
  }) => LuarizerDefManifest;
};

function isHostSurfaceLike(v: unknown): v is HostSurfaceLike {
  if (typeof v !== 'object' || v === null || !('toLuarizerDefManifest' in v)) {
    return false;
  }
  return typeof Reflect.get(v, 'toLuarizerDefManifest') === 'function';
}

async function loadSurfaceModule(absPath: string): Promise<Record<string, unknown>> {
  const href = pathToFileURL(absPath).href;
  if (absPath.endsWith('.ts') || absPath.endsWith('.mts')) {
    const { tsImport } = await import('tsx/esm/api');
    return (await tsImport(href, href)) as Record<string, unknown>;
  }
  return (await import(href)) as Record<string, unknown>;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const { command, flags } = parseArgs(argv);
  if (flags.has('help') || command === undefined) {
    printHelp();
    process.exit(command === undefined ? 1 : 0);
  }

  if (command !== 'generate-defs') {
    process.stderr.write(`Unknown command: ${command}\n`);
    printHelp();
    process.exit(1);
  }

  const cwd = process.cwd();
  const manifestPath = flags.get('manifest');
  const surfacePath = flags.get('surface');
  const hasManifest = typeof manifestPath === 'string' && manifestPath.length > 0;
  const hasSurface = typeof surfacePath === 'string' && surfacePath.length > 0;

  if (hasManifest === hasSurface) {
    process.stderr.write('Provide exactly one of: --manifest <path.json>  OR  --surface <path.ts|js>\n');
    process.exit(1);
  }

  const outFlag = flags.get('out');
  const outPath = typeof outFlag === 'string' && outFlag.length > 0 ? outFlag : undefined;

  if (hasManifest) {
    if (typeof manifestPath !== 'string') {
      process.exit(1);
    }
    const { written } = await generateDefs({
      cwd,
      manifestPath,
      outPath,
    });
    process.stdout.write(`Wrote ${resolve(written)}\n`);
    return;
  }

  if (typeof surfacePath !== 'string') {
    process.exit(1);
  }
  const absSurface = resolve(cwd, surfacePath);
  const mod = await loadSurfaceModule(absSurface);

  const surfaceRaw = mod.default;
  if (!isHostSurfaceLike(surfaceRaw)) {
    process.stderr.write(
      'The --surface module must default-export a host surface (result of defineHostSurface(...)).\n',
    );
    process.exit(1);
  }

  const stem = basename(absSurface, extname(absSurface));
  const outputRel = outPath ?? join('generated', `${stem}.d.lua`);

  const headerFlag = flags.get('header-note');
  const headerNote =
    typeof headerFlag === 'string' && headerFlag.length > 0 ? headerFlag : undefined;

  const manifest = surfaceRaw.toLuarizerDefManifest({
    output: outputRel,
    headerNote,
  });
  const { written } = writeLuaDefinitionsFromManifest({
    cwd,
    manifest,
  });
  process.stdout.write(`Wrote ${resolve(written)}\n`);
}

void main().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  process.stderr.write(`${msg}\n`);
  process.exit(1);
});
