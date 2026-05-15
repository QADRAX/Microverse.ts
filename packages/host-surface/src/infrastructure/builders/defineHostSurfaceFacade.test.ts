import { buildLuaCatsDocument } from '@luarizer/lua-defs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { luaType } from '../../domain/zodLuaType.js';
import { cap, defineHostSurface, fn } from './defineHostSurfaceFacade.js';

type ToyHost = {
  readonly n: number;
};

const entityId = luaType('EntityId', z.string());

describe('defineHostSurface', () => {
  it('builds LuarizerDefManifest for lua-defs snapshot', () => {
    const surface = defineHostSurface({
      time: {
        delta: fn<ToyHost, Record<string, never>, number>({
          capability: cap('engine:time'),
          input: z.object({}),
          output: z.number(),
          description: 'Frame delta seconds',
          handler: ({ host }) => host.n,
        }),
      },
      ecs: {
        getName: fn<ToyHost, { id: z.infer<typeof entityId> }, string | undefined>({
          capability: cap('ecs:read'),
          input: z.object({ id: entityId }),
          output: z.string().optional(),
          handler: (_ctx, { id }) => (id === 'a' ? 'Alice' : undefined),
        }),
      },
    });

    const manifest = surface.toLuarizerDefManifest({
      output: 'generated/surface.d.lua',
      headerNote: 'toy',
    });

    const doc = buildLuaCatsDocument(manifest);
    expect(doc).toMatchSnapshot();
  });
});
