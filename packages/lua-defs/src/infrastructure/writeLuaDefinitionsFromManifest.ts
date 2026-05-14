import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { buildLuaCatsDocument } from '../domain/luaCats/buildLuaCatsDocument.js';
import type { LuarizerDefManifest } from '../domain/manifest/LuarizerDefManifest.js';

export type WriteLuaDefinitionsFromManifestOptions = {
  readonly cwd: string;
  readonly manifest: LuarizerDefManifest;
  /** Overrides `manifest.output` when set. */
  readonly outPath?: string | undefined;
};

/**
 * Writes a `.d.lua` from an in-memory manifest (e.g. built via `defineHostSurface().toLuarizerDefManifest(...)`).
 */
export function writeLuaDefinitionsFromManifest(
  options: WriteLuaDefinitionsFromManifestOptions,
): { readonly written: string } {
  const lua = buildLuaCatsDocument(options.manifest);
  const outRel = options.outPath ?? options.manifest.output;
  const absOut = resolve(options.cwd, outRel);
  mkdirSync(dirname(absOut), { recursive: true });
  writeFileSync(absOut, lua, 'utf8');
  return { written: absOut };
}
