#!/usr/bin/env node
import {
  GENERATE_LUA_DEFS_COMMAND,
  printGenerateLuaDefsHelp,
  runGenerateLuaDefs,
} from './commands/generate-lua-defs.js';

const BIN = 'microverse';

/** @deprecated Use {@link GENERATE_LUA_DEFS_COMMAND}. */
const LEGACY_GENERATE_DEFS = 'generate-defs';

type CliCommand = {
  readonly name: string;
  readonly description: string;
  readonly run: (cwd: string, flags: ReadonlyMap<string, string | true>) => Promise<string>;
  readonly printHelp: (bin: string) => void;
};

const COMMANDS: ReadonlyMap<string, CliCommand> = new Map([
  [
    GENERATE_LUA_DEFS_COMMAND,
    {
      name: GENERATE_LUA_DEFS_COMMAND,
      description: 'Emit LuaCATS .d.lua for Lua microverse host surfaces',
      run: runGenerateLuaDefs,
      printHelp: printGenerateLuaDefsHelp,
    },
  ],
]);

function printHelp(): void {
  const lines = [
    `${BIN} — tooling for Microverse (Lua and future runtimes)`,
    '',
    'Commands:',
    ...[...COMMANDS.values()].map((c) => `  ${c.name.padEnd(22)} ${c.description}`),
    '',
    `Run \`${BIN} <command> --help\` for command-specific usage.`,
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

function resolveCommand(name: string): CliCommand | undefined {
  if (name === LEGACY_GENERATE_DEFS) {
    process.stderr.write(
      `Warning: \`${LEGACY_GENERATE_DEFS}\` is deprecated; use \`${GENERATE_LUA_DEFS_COMMAND}\` instead.\n`,
    );
    return COMMANDS.get(GENERATE_LUA_DEFS_COMMAND);
  }
  return COMMANDS.get(name);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const { command, flags } = parseArgs(argv);

  if (flags.has('help') && command === undefined) {
    printHelp();
    process.exit(0);
  }

  if (command === undefined) {
    printHelp();
    process.exit(1);
  }

  const cmd = resolveCommand(command);
  if (cmd === undefined) {
    process.stderr.write(`Unknown command: ${command}\n\n`);
    printHelp();
    process.exit(1);
  }

  if (flags.has('help')) {
    cmd.printHelp(BIN);
    process.exit(0);
  }

  const cwd = process.cwd();
  const written = await cmd.run(cwd, flags);
  process.stdout.write(`Wrote ${written}\n`);
}

void main().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  process.stderr.write(`${msg}\n`);
  process.exit(1);
});
