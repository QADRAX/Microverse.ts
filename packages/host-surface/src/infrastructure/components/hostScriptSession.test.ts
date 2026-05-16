import type { CapabilityId } from '@microverse.ts/runtime-capabilities';
import {
  ConsoleLogger,
  createMicroverseId,
  createScriptInstanceContext,
  createStubMicroverseRuntime,
  StubRuntimeAdapter,
} from '@microverse.ts/runtime-core';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { defineHostSurfaceFor } from '../builders/defineHostSurfaceFacade.js';
import { HostScriptSession } from './hostScriptSession.js';

type H = { readonly tag: string };

describe('HostScriptSession', () => {
  it('openSession then dispose does not throw (stub runtime)', async () => {
    const surface = defineHostSurfaceFor<H>()
      .bridge('ping')
      .method('go', {
        requires: 'demo:ping',
        input: z.object({}),
        output: z.string(),
        handler: ({ host }) => host.tag,
      })
      .build();

    const session = new HostScriptSession({
      runtime: createStubMicroverseRuntime({
        adapter: new StubRuntimeAdapter(),
        logger: new ConsoleLogger(),
      }),
      surface,
      host: { tag: 'ok' },
      slotKey: createMicroverseId('sess-1'),
      allowedCapabilities: surface.pickCapabilities('demo:ping') as readonly CapabilityId[],
      script: createScriptInstanceContext({
        instanceId: 'sess-1',
        scriptId: 'test',
        slotKey: 'sess-1',
      }),
    });

    await session.openSession();
    const r = await session.runChunk('-- stub');
    expect(r._tag).toBe('ok');
    await session.dispose();
  });

  it('narrows invokeComponentEventHook when THooks is provided', async () => {
    const componentHooks = {
      OrderPlaced: z.object({ orderId: z.string(), amountCents: z.number() }),
    } as const;

    const surface = defineHostSurfaceFor<H>()
      .bridge('ping')
      .method('go', {
        requires: 'demo:ping',
        input: z.object({}),
        output: z.string(),
        handler: ({ host }) => host.tag,
      })
      .componentHooks(componentHooks)
      .build();

    const session = new HostScriptSession<H, typeof componentHooks>({
      runtime: createStubMicroverseRuntime({
        adapter: new StubRuntimeAdapter(),
        logger: new ConsoleLogger(),
      }),
      surface,
      host: { tag: 'ok' },
      slotKey: createMicroverseId('sess-hooks'),
      allowedCapabilities: surface.pickCapabilities('demo:ping') as readonly CapabilityId[],
      script: createScriptInstanceContext({
        instanceId: 'sess-hooks',
        scriptId: 'test',
        slotKey: 'sess-hooks',
      }),
    });

    await session.openSession();
    await session.runChunk('local C = component:extend()\nfunction C:onOrderPlaced() end\n');
    const ok = await session.invokeComponentEventHook('onOrderPlaced', {
      orderId: 'o-1',
      amountCents: 10,
    });
    expect(ok._tag).toBe('ok');
    await session.dispose();
  });
});
