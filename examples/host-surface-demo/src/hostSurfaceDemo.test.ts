import { buildLuaCatsDocument } from '@luarizer/lua-defs';
import { cap, defineHostSurface, fn, HostScriptSession } from '@luarizer/host-surface';
import { createSandboxId, Luarizer } from '@luarizer/luarizer';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

type ClockHost = { readonly getDt: () => number };

const demoSurface = defineHostSurface({
  time: {
    delta: fn<ClockHost, Record<string, never>, number>({
      capability: cap('engine:time'),
      input: z.object({}),
      output: z.number(),
      handler: ({ host }) => host.getDt(),
    }),
  },
});

describe('host-surface-demo', () => {
  it('toLuarizerDefManifest feeds lua-defs', () => {
    const manifest = demoSurface.toLuarizerDefManifest({ output: 'generated/demo.d.lua' });
    const doc = buildLuaCatsDocument(manifest);
    expect(doc).toContain('function time:delta');
    expect(doc).toContain('---@return number');
  });

  it('HostScriptSession + Wasmoon: Lua calls time.delta', async () => {
    const runtime = Luarizer.createWasmRuntime();
    const session = new HostScriptSession({
      runtime,
      surface: demoSurface,
      host: { getDt: () => 0.016 },
      slotKey: createSandboxId('host-surface-demo-1'),
      allowedCapabilities: [cap('engine:time')],
    });
    await session.openSession();
    const r = await session.runChunk(`
      local d = time.delta({})
      assert(type(d) == "number" and d > 0, "bad dt: " .. tostring(d))
    `);
    expect(r._tag).toBe('ok');
    await session.dispose();
  });
});
