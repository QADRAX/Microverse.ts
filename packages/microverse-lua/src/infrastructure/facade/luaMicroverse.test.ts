import { defineHostSurface } from '@microverse/microverse-lua';
import { describe, it } from 'vitest';
import { z } from 'zod';

import { createLuaMicroverse, type TaggedLuaMicroverseHost } from './luaMicroverse.js';

type H = { readonly n: number };

describe('createLuaMicroverse', () => {
  it('registers a script and runs typed emitToAllScripts (built-in Wasm runtime)', async () => {
    const hooks = { Ping: z.object({ x: z.number() }) } as const;
    type Host = TaggedLuaMicroverseHost<typeof hooks, H>;

    const surface = defineHostSurface()
      .bridge('demo')
      .method('tick', {
        requires: 'demo:tick',
        input: z.object({}),
        output: z.number(),
        handler: ({ host }) => host.n,
      })
      .workflowHooks(hooks)
      .build();

    const microverse = createLuaMicroverse({
      host: { n: 0 } satisfies Host,
      surface,
    });

    await microverse.registerScript({
      scriptId: 's1',
      script: '-- stub',
      capabilities: surface.pickCapabilities('demo:tick'),
    });

    await microverse.emitToAllScripts('Ping', { x: 1 });
    await microverse.dispose();
  });
});
