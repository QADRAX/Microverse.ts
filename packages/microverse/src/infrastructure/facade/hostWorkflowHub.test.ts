import { cap, defineHostSurface, fn } from '@microverse/microverse';
import {
  ConsoleLogger,
  createStubMicroverseRuntime,
  StubRuntimeAdapter,
} from '@microverse/runtime-core';
import { describe, it } from 'vitest';
import { z } from 'zod';

import { createHostWorkflowHub, type TaggedWorkflowHost } from './hostWorkflowHub.js';

type H = { readonly n: number };

describe('createHostWorkflowHub', () => {
  it('registers a workflow and runs typed emitToAllWorkflows', async () => {
    const hooks = { Ping: z.object({ x: z.number() }) } as const;
    type Host = TaggedWorkflowHost<typeof hooks, H>;

    const surface = defineHostSurface(
      {
        demo: {
          tick: fn<H, Record<string, never>, number>({
            capability: cap('demo:tick'),
            input: z.object({}),
            output: z.number(),
            handler: ({ host }) => host.n,
          }),
        },
      },
      hooks,
    );

    const hub = createHostWorkflowHub({
      host: { n: 0 } satisfies Host,
      surface,
      runtime: createStubMicroverseRuntime({
        adapter: new StubRuntimeAdapter(),
        logger: new ConsoleLogger(),
      }),
    });

    await hub.registerWorkflow({
      workflowId: 'w1',
      script: '-- stub',
      allowedCapabilities: [cap('demo:tick')],
    });

    await hub.emitToAllWorkflows('Ping', { x: 1 });
    await hub.dispose();
  });
});
