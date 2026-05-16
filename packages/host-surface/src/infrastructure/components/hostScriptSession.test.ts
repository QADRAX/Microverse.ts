import type { CapabilityId } from '@microverse/runtime-capabilities';
import {
  ConsoleLogger,
  createMicroverseId,
  createStubMicroverseRuntime,
  StubRuntimeAdapter,
} from '@microverse/runtime-core';
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
    });

    await session.openSession();
    const r = await session.runChunk('-- stub');
    expect(r._tag).toBe('ok');
    const hook = await session.invokeGlobalHookIfPresent('onSmoke', { n: 1, ok: true, msg: 'x' });
    expect(hook._tag).toBe('ok');
    await session.dispose();
  });

  it('narrows invokeGlobalHookIfPresent when THooks is provided', async () => {
    const workflowHooks = {
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
      .workflowHooks(workflowHooks)
      .build();

    const session = new HostScriptSession<H, typeof workflowHooks>({
      runtime: createStubMicroverseRuntime({
        adapter: new StubRuntimeAdapter(),
        logger: new ConsoleLogger(),
      }),
      surface,
      host: { tag: 'ok' },
      slotKey: createMicroverseId('sess-hooks'),
      allowedCapabilities: surface.pickCapabilities('demo:ping') as readonly CapabilityId[],
    });

    await session.openSession();
    const ok = await session.invokeGlobalHookIfPresent('onOrderPlaced', {
      orderId: 'o-1',
      amountCents: 10,
    });
    expect(ok._tag).toBe('ok');
    await session.dispose();
  });
});
