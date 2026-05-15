import type { AsyncUseCase } from '@microverse/shared';

import type { LuaDefinitionsFromManifestFilePorts } from '../ports/LuaDefinitionsFromManifestFilePorts.js';

export type GenerateLuaDefinitionsFileInput = {
  readonly cwd: string;
  readonly manifestPath: string;
  /** Si se omite, se usa `manifest.output` tras parsear. */
  readonly outPath?: string | undefined;
};

export type GenerateLuaDefinitionsFileUseCase = AsyncUseCase<
  LuaDefinitionsFromManifestFilePorts,
  readonly [GenerateLuaDefinitionsFileInput],
  { readonly written: string }
>;

/**
 * Puertos (tuple): `[fs, parseManifest, buildLuaCatsDocument]`.
 */
export async function generateLuaDefinitionsFile(
  ports: LuaDefinitionsFromManifestFilePorts,
  input: GenerateLuaDefinitionsFileInput,
): Promise<{ readonly written: string }> {
  const [fs, parseManifest, buildLuaCatsDocument] = ports;
  const absManifest = fs.resolve(input.cwd, input.manifestPath);
  const raw = await fs.readTextFile(absManifest);
  const manifest = parseManifest(raw);
  const lua = buildLuaCatsDocument(manifest);
  const outRel = input.outPath ?? manifest.output;
  const absOut = fs.resolve(input.cwd, outRel);
  await fs.mkdirpForFile(absOut);
  await fs.writeTextFile(absOut, lua);
  return { written: absOut };
}
