import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { buildLuaCatsDocument } from '../domain/luaCats/buildLuaCatsDocument.js';
import type { LuaDefManifest } from '../domain/manifest/LuaDefManifest.js';

export type WriteLuaDefinitionsFromManifestOptions = {
  readonly cwd: string;
  readonly manifest: LuaDefManifest;
  /** Overrides `manifest.output` when set. */
  readonly outPath?: string | undefined;
};

/**
 * Writes a `.d.lua` from an in-memory manifest (e.g. built via `defineHostSurface().toLuaDefManifest(...)`).
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
