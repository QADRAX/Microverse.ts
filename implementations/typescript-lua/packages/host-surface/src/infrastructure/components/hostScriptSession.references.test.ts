import {
  ConsoleLogger,
  createMicroverseId,
  createScriptInstanceContext,
  createStubMicroverseRuntime,
  StubRuntimeAdapter,
} from '@microverse.ts/runtime-core';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { defineHostSurfaceFor } from '../builders/defineHostSurfaceFacade';
import type { ScriptReferenceResolverPort } from '../../application/ports/ScriptReferenceResolverPort';
import { HostScriptSession } from './hostScriptSession';

type H = { readonly entities: Map<string, { readonly id: string }> };

describe('HostScriptSession references', () => {
  it('wraps reference fields via ScriptReferenceResolverPort', async () => {
    const surface = defineHostSurfaceFor<H>()
      .componentType('RefDemo', {
        capabilities: ['demo:ping'],
        props: z.object({ targetId: z.string().nullable() }),
        state: z.object({}),
        references: { targetId: { kind: 'entityRef' } },
      })
      .bridge('ping')
      .method('go', {
        requires: 'demo:ping',
        input: z.object({}),
        output: z.string(),
        handler: () => 'ok',
      })
      .build();

    const resolver: ScriptReferenceResolverPort = {
      wrap: (ctx) => ({ wrapped: ctx.raw ?? 'none', field: ctx.field }),
    };

    const session = new HostScriptSession({
      runtime: createStubMicroverseRuntime({
        adapter: new StubRuntimeAdapter(),
        logger: new ConsoleLogger(),
      }),
      surface,
      host: { entities: new Map() },
      slotKey: createMicroverseId('ref-1'),
      profileId: 'RefDemo',
      referenceResolver: resolver,
      script: createScriptInstanceContext({
        instanceId: 'ref-1',
        scriptId: 'ref',
        slotKey: 'ref-1',
      }),
    });

    await session.openSession();
    await session.setProps({ targetId: 'entity-42' });
    const r = await session.runChunk(`
local impl = rawget(_ENV, "__microverse_lua_ComponentImpl")
if type(impl) ~= "table" then error("no impl") end
local ref = impl.references.targetId
if type(ref) ~= "table" or ref.wrapped ~= "entity-42" then
  error("bad ref")
end
`);
    expect(r._tag).toBe('ok');
    await session.dispose();
  });
});
