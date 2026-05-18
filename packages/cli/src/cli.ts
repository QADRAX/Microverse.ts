#!/usr/bin/env node
import { CODEGEN_COMMAND, printCodegenHelp, runCodegen } from './commands/codegen';

const BIN = 'microverse';

type CliCommand = {
  readonly name: string;
  readonly description: string;
  readonly run: (cwd: string, flags: ReadonlyMap<string, string | true>) => Promise<string>;
  readonly printHelp: (bin: string) => void;
};

const CODEGEN: CliCommand = {
  name: CODEGEN_COMMAND,
  description: 'Emit SurfaceSpec .json + LuaCATS .d.lua from a host surface',
  run: (cwd, flags) => runCodegen(cwd, flags),
  printHelp: printCodegenHelp,
};

const COMMANDS: ReadonlyMap<string, CliCommand> = new Map([[CODEGEN_COMMAND, CODEGEN]]);

function printHelp(): void {
  const lines = [
    `${BIN} — tooling for Microverse (Lua and future runtimes)`,
    '',
    'Commands:',
    `  ${CODEGEN_COMMAND.padEnd(22)} ${CODEGEN.description}`,
    '',
    `Run \`${BIN} ${CODEGEN_COMMAND} --help\` for usage.`,
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

  if (flags.has('help') && command === undefined) {
    printHelp();
    process.exit(0);
  }

  if (command === undefined) {
    printHelp();
    process.exit(1);
  }

  const cmd = COMMANDS.get(command);
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
