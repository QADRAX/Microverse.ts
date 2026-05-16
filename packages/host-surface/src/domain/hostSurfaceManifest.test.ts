import { buildLuaCatsDocument } from '@microverse.ts/lua-defs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { normalizeMethodDef } from './surfaceMethodDef';
import { buildLuaDefManifestFromHostSurfaceSpec } from './hostSurfaceManifest';

describe('buildLuaDefManifestFromHostSurfaceSpec', () => {
  it('emits async handle + onComplete for async handlers', () => {
    const tick = normalizeMethodDef({
      requires: 'asyncio:tick',
      input: z.object({ delayMs: z.number(), seed: z.number() }),
      output: z.object({ value: z.number() }),
      handler: async () => ({ value: 1 }),
    });
    const spec = { asyncio: { tick } };
    const manifest = buildLuaDefManifestFromHostSurfaceSpec(spec, { output: 'out.d.lua' });
    const doc = buildLuaCatsDocument(manifest);
    expect(tick.async).toBe(true);
    expect(doc).toContain('---@class AsyncioTickHandle');
    expect(doc).toContain('---@field await fun(self: AsyncioTickHandle): { value: number }');
    expect(doc).not.toContain('function AsyncioTickHandle:await()');
    expect(doc).toContain(
      '---@field tick fun(self: Asyncio, payload: { delayMs: number; seed: number }, onComplete: fun(result: { value: number })|nil): AsyncioTickHandle',
    );
    expect(doc).not.toContain('function Asyncio:tick');
    expect(doc).not.toContain('---@param onComplete');
  });
});
