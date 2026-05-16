import { defineHostSurfaceFor } from '@microverse.ts/host-surface';
import { describe, it } from 'vitest';
import { z } from 'zod';

import { createLuaMicroverse, type TaggedLuaMicroverseHost } from './luaMicroverse.js';

type H = { readonly n: number };

describe('createLuaMicroverse', () => {
  it('mounts a script instance and runs typed emitToAllInstances (built-in Wasm runtime)', async () => {
    const hooks = { Ping: z.object({ x: z.number() }) } as const;
    type Host = TaggedLuaMicroverseHost<typeof hooks, H>;

    const surface = defineHostSurfaceFor<H>()
      .bridge('demo')
      .method('tick', {
        requires: 'demo:tick',
        input: z.object({}),
        output: z.number(),
        handler: ({ host }) => host.n,
      })
      .componentHooks(hooks)
      .build();

    const microverse = createLuaMicroverse({
      host: { n: 0 } satisfies Host,
      surface,
    });

    microverse.registerScriptDefinition({ scriptId: 's1', source: '-- stub' });
    await microverse.mountScriptInstance({
      instanceId: 's1',
      scriptId: 's1',
      capabilities: surface.pickCapabilities('demo:tick'),
    });

    await microverse.emitToAllInstances('Ping', { x: 1 });
    await microverse.dispose();
  });
});
