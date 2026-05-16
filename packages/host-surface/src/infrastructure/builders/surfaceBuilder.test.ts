import { buildLuaCatsDocument } from '@microverse.ts/lua-defs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { luaType } from '../../domain/zodLuaType.js';
import { defineHostSurfaceFor } from './defineHostSurfaceFacade.js';

type ToyHost = {
  readonly n: number;
};

const entityId = luaType('EntityId', z.string());

describe('SurfaceBuilder (fluent defineHostSurfaceFor)', () => {
  it('builds LuaDefManifest for lua-defs snapshot', () => {
    const surface = defineHostSurfaceFor<ToyHost>()
      .bridge('time')
      .method('delta', {
        requires: 'engine:time',
        input: z.object({}),
        output: z.number(),
        description: 'Frame delta seconds',
        handler: ({ host }) => host.n,
      })
      .bridge('ecs')
      .method('getName', {
        requires: 'ecs:read',
        input: z.object({ id: entityId }),
        output: z.string().optional(),
        handler: (_ctx, { id }) => (id === 'a' ? 'Alice' : undefined),
      })
      .build();

    const manifest = surface.toLuaDefManifest({
      output: 'generated/surface.d.lua',
      headerNote: 'toy',
    });

    const doc = buildLuaCatsDocument(manifest);
    expect(doc).toMatchSnapshot();
  });

  it('pickCapabilities accepts declared capability literals', () => {
    const surface = defineHostSurfaceFor<ToyHost>()
      .bridge('time')
      .method('delta', {
        requires: 'engine:time',
        input: z.object({}),
        output: z.number(),
        handler: ({ host }) => host.n,
      })
      .build();

    expect(surface.pickCapabilities('engine:time')).toEqual(['engine:time']);
  });

  it('workflowHooks attach to compiled surface', () => {
    const hooks = { Ping: z.object({ x: z.number() }) } as const;
    const surface = defineHostSurfaceFor<ToyHost>()
      .bridge('demo')
      .method('tick', {
        requires: 'demo:tick',
        input: z.object({}),
        output: z.number(),
        handler: ({ host }) => host.n,
      })
      .workflowHooks(hooks)
      .build();

    expect(surface.workflowHooks).toBe(hooks);
  });

  it('rejects reserved bridge/method names', () => {
    expect(() =>
      defineHostSurfaceFor<ToyHost>()
        .bridge('__proto__' as 'time')
        .method('delta', {
          requires: 'engine:time',
          input: z.object({}),
          output: z.number(),
          handler: ({ host }) => host.n,
        }),
    ).toThrow(/reserved key/);

    expect(() =>
      defineHostSurfaceFor<ToyHost>()
        .bridge('time')
        .method('constructor' as 'delta', {
          requires: 'engine:time',
          input: z.object({}),
          output: z.number(),
          handler: ({ host }) => host.n,
        }),
    ).toThrow(/reserved key/);
  });

  it('marks async handlers in manifest', () => {
    const surface = defineHostSurfaceFor<ToyHost>()
      .bridge('asyncio')
      .method('run', {
        requires: 'asyncio:run',
        input: z.object({}),
        output: z.number(),
        handler: async () => 1,
      })
      .build();

    const manifest = surface.toLuaDefManifest({ output: 'generated/async.d.lua' });
    const doc = buildLuaCatsDocument(manifest);
    expect(doc).toContain('AsyncioRunHandle');
  });
});
