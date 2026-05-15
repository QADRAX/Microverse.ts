import { buildLuaCatsDocument } from '@microverse/lua-defs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { cap, fn } from './hostSurfaceMethodHelpers.js';
import { buildLuaDefManifestFromHostSurfaceSpec } from './hostSurfaceManifest.js';

describe('buildLuaDefManifestFromHostSurfaceSpec', () => {
  it('emits async handle + onComplete for async fn handlers', () => {
    const spec = {
      asyncio: {
        tick: fn<unknown, { delayMs: number; seed: number }, { value: number }>({
          capability: cap('asyncio:tick'),
          input: z.object({ delayMs: z.number(), seed: z.number() }),
          output: z.object({ value: z.number() }),
          handler: async () => ({ value: 1 }),
        }),
      },
    };
    const manifest = buildLuaDefManifestFromHostSurfaceSpec(spec, { output: 'out.d.lua' });
    const doc = buildLuaCatsDocument(manifest);
    expect(spec.asyncio.tick.async).toBe(true);
    expect(doc).toContain('---@class AsyncioTickHandle');
    expect(doc).toContain('---@field await fun(self: AsyncioTickHandle): { value: number }');
    expect(doc).not.toContain('function AsyncioTickHandle:await()');
    expect(doc).toContain('---@param onComplete fun(result: { value: number })|nil');
    expect(doc).toContain('---@return AsyncioTickHandle');
    expect(doc).toContain('function asyncio:tick(payload, onComplete) end');
  });
});
