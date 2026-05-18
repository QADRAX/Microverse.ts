import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import type { SurfaceSpecDocument } from '@microverse.ts/surface-spec';

export type WriteSurfaceSpecFileOptions = {
  readonly cwd: string;
  readonly relativePath: string;
  readonly document: SurfaceSpecDocument;
};

export async function writeSurfaceSpecFile(
  options: WriteSurfaceSpecFileOptions,
): Promise<{ readonly written: string }> {
  const written = resolve(options.cwd, options.relativePath);
  await mkdir(dirname(written), { recursive: true });
  await writeFile(written, `${JSON.stringify(options.document, null, 2)}\n`, 'utf8');
  return { written };
}
