import {
  ConsoleLogger,
  createSandboxId,
  createStubSandboxRuntime,
  StubRuntimeAdapter,
} from '@luarizer/runtime-core';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { cap, defineHostSurface, fn } from './defineHostSurface';
import { HostScriptSession } from './hostScriptSession';

type H = { readonly tag: string };

describe('HostScriptSession', () => {
  it('openSession then dispose does not throw (stub runtime)', async () => {
    const surface = defineHostSurface({
      ping: {
        go: fn<H, Record<string, never>, string>({
          capability: cap('demo:ping'),
          input: z.object({}),
          output: z.string(),
          handler: ({ host }) => host.tag,
        }),
      },
    });

    const session = new HostScriptSession({
      runtime: createStubSandboxRuntime({
        adapter: new StubRuntimeAdapter(),
        logger: new ConsoleLogger(),
      }),
      surface,
      host: { tag: 'ok' },
      slotKey: createSandboxId('sess-1'),
      allowedCapabilities: [cap('demo:ping')],
    });

    await session.openSession();
    const r = await session.runChunk('-- stub');
    expect(r._tag).toBe('ok');
    const hook = await session.invokeGlobalHookIfPresent('onSmoke', { n: 1, ok: true, msg: 'x' });
    expect(hook._tag).toBe('ok');
    await session.dispose();
  });
});
