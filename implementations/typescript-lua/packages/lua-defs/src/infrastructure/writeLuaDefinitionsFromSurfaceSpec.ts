import type { SurfaceSpecDocument } from '@microverse.ts/surface-spec';

import type { SurfaceSpecToLuaDefManifestOptions } from '../profile/lua1/Lua1TypeOverlay';
import { surfaceSpecToLuaDefManifest } from '../profile/lua1/surfaceSpecToLuaDefManifest';
import {
  writeLuaDefinitionsFromManifest,
  type WriteLuaDefinitionsFromManifestOptions,
} from './writeLuaDefinitionsFromManifest';

export type WriteLuaDefinitionsFromSurfaceSpecOptions = Omit<
  WriteLuaDefinitionsFromManifestOptions,
  'manifest'
> & {
  readonly document: SurfaceSpecDocument;
  readonly manifestOptions: Omit<SurfaceSpecToLuaDefManifestOptions, 'output'> & {
    readonly output?: string | undefined;
  };
};

export function writeLuaDefinitionsFromSurfaceSpec(
  options: WriteLuaDefinitionsFromSurfaceSpecOptions,
): { readonly written: string } {
  const output = options.manifestOptions.output ?? 'generated/surface.d.lua';
  const manifest = surfaceSpecToLuaDefManifest(options.document, {
    ...options.manifestOptions,
    output,
  });
  return writeLuaDefinitionsFromManifest({
    cwd: options.cwd,
    manifest,
    outPath: options.outPath,
  });
}
