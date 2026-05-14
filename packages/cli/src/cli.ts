#!/usr/bin/env node
import { resolve } from 'node:path';

import { generateDefs } from '@luarizer/lua-defs';

function printHelp(): void {
  const lines = [
    'luarizer — tooling for Luarizer Lua sandboxes',
    '',
    'Commands:',
    '  generate-defs   Emit LuaCATS .d.lua from a JSON manifest',
    '',
    'Usage:',
    '  luarizer generate-defs --manifest <path/to/luarizer.def.json> [--out <path>]',
    '',
    '  --out   Optional; defaults to manifest.output',
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

  const manifest = flags.get('manifest');
  if (typeof manifest !== 'string' || manifest.length === 0) {
    process.stderr.write('Missing required flag: --manifest <path>\n');
    process.exit(1);
  }

  const outFlag = flags.get('out');
  const outPath = typeof outFlag === 'string' && outFlag.length > 0 ? outFlag : undefined;

  const cwd = process.cwd();
  const { written } = await generateDefs({
    cwd,
    manifestPath: manifest,
    outPath,
  });
  process.stdout.write(`Wrote ${resolve(written)}\n`);
}

void main().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  process.stderr.write(`${msg}\n`);
  process.exit(1);
});
