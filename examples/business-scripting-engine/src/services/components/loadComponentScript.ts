import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/**
 * Reads a UTF-8 Lua file from this package's `lua/` directory (e.g. `components/promotions.lua`).
 * Use from Vitest or Node to keep component scripts in separate files instead of inline strings.
 */
export function readComponentLua(relativePathFromLuaDir: string): string {
  const full = join(packageRoot, 'lua', relativePathFromLuaDir);
  return readFileSync(full, 'utf8');
}
