import { defineHostSurfaceFor } from '@microverse.ts/host-surface';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createLuaMicroverse } from './luaMicroverse';

type Host = {
  readonly auditLines: string[];
};

describe('LuaMicroverse props + instances', () => {
  const caps = ['demo:ping'] as const;

  const surface = defineHostSurfaceFor<Host>()
    .bridge('audit')
    .method('record', {
      requires: 'demo:ping',
      input: z.object({ line: z.string() }),
      output: z.null(),
      handler: ({ host, script }, input) => {
        host.auditLines.push(`${script.instanceId}:${script.scriptId}:${input.line}`);
        return null;
      },
    })
    .componentHooks({
      OrderPlaced: z.object({ orderId: z.string(), amountCents: z.number() }),
    })
    .build();

  it('mounts two instances of the same scriptId with independent props', async () => {
    const source = `
local C = component:extend()
function C:init()
  self.state = { tag = "init" }
end
`;
    const microverse = createLuaMicroverse({
      host: { auditLines: [] },
      surface,
    });
    microverse.registerScriptDefinition({ scriptId: 'counter', source });

    await microverse.mountScriptInstance({
      instanceId: 'e1::counter',
      scriptId: 'counter',
      props: { n: 1 },
      capabilities: [...caps],
      audit: { entityId: 'e1' },
    });
    await microverse.mountScriptInstance({
      instanceId: 'e2::counter',
      scriptId: 'counter',
      props: { n: 2 },
      capabilities: [...caps],
      audit: { entityId: 'e2' },
    });

    expect(microverse.getInstanceProps('e1::counter').n).toBe(1);
    expect(microverse.getInstanceProps('e2::counter').n).toBe(2);

    await microverse.patchInstanceProps('e1::counter', { n: 10 });
    expect(microverse.getInstanceProps('e1::counter').n).toBe(10);
    expect(microverse.getInstanceProps('e2::counter').n).toBe(2);

    await microverse.unmountScriptInstance('e1::counter');
    await microverse.unmountScriptInstance('e2::counter');
    await microverse.dispose();
  });

  it('flushInstanceProps returns Lua-written property values', async () => {
    const source = `local C = component:extend()\nfunction C:init() end\n`;
    const microverse = createLuaMicroverse({
      host: { auditLines: [] },
      surface,
    });
    microverse.registerScriptDefinition({ scriptId: 'writer', source });
    await microverse.mountScriptInstance({
      instanceId: 'w1',
      scriptId: 'writer',
      capabilities: [...caps],
    });
    const inst = microverse.getInstance('w1');
    await inst!.runChunk(`
local impl = rawget(_ENV, "__microverse_lua_ComponentImpl")
impl.properties.score = 7
`);

    const flushed = await microverse.flushInstanceProps('w1');
    expect(flushed?.score).toBe(7);
    expect(microverse.getInstanceProps('w1').score).toBe(7);

    await microverse.unmountScriptInstance('w1');
    await microverse.dispose();
  });

  it('nested props round-trip through patch', async () => {
    const source = `local C = component:extend()\nfunction C:init() end\n`;
    const microverse = createLuaMicroverse({ host: { auditLines: [] }, surface });
    microverse.registerScriptDefinition({ scriptId: 'nested', source });
    await microverse.mountScriptInstance({
      instanceId: 'n1',
      scriptId: 'nested',
      props: { path: { x: 1, y: 2 }, tags: ['a'] },
      capabilities: [...caps],
    });
    await microverse.patchInstanceProps('n1', { path: { x: 9, y: 2 } });
    expect(microverse.getInstanceProps('n1').path).toEqual({ x: 9, y: 2 });
    await microverse.unmountScriptInstance('n1');
    await microverse.dispose();
  });

  it('bridge handler receives script audit context', async () => {
    const source = `
local C = component:extend()
function C:init()
  self.bridges.audit:record({ line = "from-init" })
end
`;
    const host: Host = { auditLines: [] };
    const microverse = createLuaMicroverse({ host, surface });
    microverse.registerScriptDefinition({ scriptId: 'audit-script', source });
    await microverse.mountScriptInstance({
      instanceId: 'ent::audit-script',
      scriptId: 'audit-script',
      capabilities: [...caps],
      audit: { entityId: 'ent' },
    });
    expect(host.auditLines[0]).toBe('ent::audit-script:audit-script:from-init');
    await microverse.unmountScriptInstance('ent::audit-script');
    await microverse.dispose();
  });

  it('component receives domain events via onOrderPlaced', async () => {
    const source = `
local C = component:extend()
function C:init()
  self.state = { hits = 0 }
end
function C:onOrderPlaced(evt)
  self.state.hits = (self.state.hits or 0) + 1
  self.bridges.audit:record({ line = "hits=" .. tostring(self.state.hits) .. ":" .. evt.orderId })
end
`;
    const host: Host = { auditLines: [] };
    const microverse = createLuaMicroverse({ host, surface });
    microverse.registerScriptDefinition({ scriptId: 'combo', source });
    await microverse.mountScriptInstance({
      instanceId: 'c1',
      scriptId: 'combo',
      capabilities: [...caps],
    });
    await microverse.emitToAllInstances('OrderPlaced', { orderId: 'o-99', amountCents: 1 });
    expect(host.auditLines[0]).toBe('c1:combo:hits=1:o-99');
    await microverse.unmountScriptInstance('c1');
    await microverse.dispose();
  });
});
