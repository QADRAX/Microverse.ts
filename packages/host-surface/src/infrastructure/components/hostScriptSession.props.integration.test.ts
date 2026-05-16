import type { CapabilityId } from '@microverse.ts/runtime-capabilities';
import {
  ConsoleLogger,
  createMicroverseId,
  createScriptInstanceContext,
  createStubMicroverseRuntime,
} from '@microverse.ts/runtime-core';
import { WasmoonRuntimeAdapter } from '@microverse.ts/runtime-wasm';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { defineHostSurfaceFor } from '../builders/defineHostSurfaceFacade.js';
import { HostScriptSession } from './hostScriptSession.js';

type H = { readonly lines: string[] };

describe('HostScriptSession props (wasm)', () => {
  it('flushDirtyProps returns Lua-written values', async () => {
    const surface = defineHostSurfaceFor<H>()
      .bridge('audit')
      .method('record', {
        requires: 'demo:ping',
        input: z.object({ line: z.string() }),
        output: z.null(),
        handler: ({ host }) => {
          host.lines.push('ok');
          return null;
        },
      })
      .build();

    const adapter = new WasmoonRuntimeAdapter();
    const runtime = createStubMicroverseRuntime({ adapter, logger: new ConsoleLogger() });
    const slotKey = createMicroverseId('props-sess');
    const session = new HostScriptSession({
      runtime,
      surface,
      host: { lines: [] },
      slotKey,
      allowedCapabilities: surface.pickCapabilities('demo:ping') as readonly CapabilityId[],
      script: createScriptInstanceContext({
        instanceId: 'i1',
        scriptId: 'writer',
        slotKey: String(slotKey),
      }),
    });

    await session.openSession();
    await session.runChunk(`local C = component:extend()\nfunction C:init() end\n`);
    await session.runChunk(`
local impl = rawget(_ENV, "__microverse_lua_ComponentImpl")
impl.properties.score = 7
`);
    const flushed = await session.flushDirtyProps();
    expect(flushed?.score).toBe(7);
    await session.dispose();
  });
});
