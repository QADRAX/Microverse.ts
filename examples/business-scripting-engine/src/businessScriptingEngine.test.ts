import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { BusinessScriptingEngine, type BusinessSurfaceCapabilities } from './BusinessScriptingEngine.js';
import surface from './businessSurface.js';
import { createDefaultBusinessHost, readComponentLua } from './services/index.js';

const MATH_LIB = readComponentLua('lib/math_helpers.lua');

function createEngineWithSharedMathLib(host: ReturnType<typeof createDefaultBusinessHost>) {
  return new BusinessScriptingEngine(host, { sharedLuaChunks: [MATH_LIB] });
}

async function loadScript(
  engine: BusinessScriptingEngine,
  scriptId: string,
  luaSource: string,
  capabilities: readonly BusinessSurfaceCapabilities[],
  options?: { readonly injectLuaChunks?: readonly string[] },
): Promise<void> {
  engine.registerScriptDefinition(scriptId, luaSource, options);
  await engine.mountScriptInstance({ scriptId, capabilities, injectLuaChunks: options?.injectLuaChunks });
}

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const generatedDefsPath = join(packageRoot, 'generated', 'businessSurface.d.lua');

describe('BusinessScriptingEngine (Lua files under lua/)', () => {
  it('loads promotions.lua and reacts to domain events', async () => {
    const host = createDefaultBusinessHost([
      { id: 'o-1', customerId: 'c-1', totalCents: 2000 },
    ]);
    const engine = new BusinessScriptingEngine(host);

    await loadScript(engine,
      'promotions',
      readComponentLua('components/promotions.lua'),
      surface.pickCapabilities('orders:read', 'billing:charge', 'notifications:send'),
    );

    await engine.dispatch({
      kind: 'OrderPlaced',
      orderId: 'o-1',
      amountCents: 9999,
      customerId: 'c-1',
    });

    expect(host.billing.totalChargedCentsForOrder('o-1')).toBe(1500);
    expect(host.notifications.getSent().some((m) => m.channel === 'audit')).toBe(true);

    await engine.dispatch({
      kind: 'InventoryLow',
      sku: 'WIDGET',
      unitsLeft: 1,
    });
    expect(
      host.notifications.getSent().some((m) => m.channel === 'ops' && m.message.includes('WIDGET')),
    ).toBe(true);

    await engine.dispose();
  });

  it('loads order_echo.lua for a focused notification assertion', async () => {
    const host = createDefaultBusinessHost([{ id: 'o-echo', customerId: 'c-x', totalCents: 1 }]);
    const engine = new BusinessScriptingEngine(host);

    await loadScript(engine,
      'echo',
      readComponentLua('components/order_echo.lua'),
      surface.pickCapabilities('notifications:send'),
    );

    await engine.dispatch({
      kind: 'OrderPlaced',
      orderId: 'o-echo',
      amountCents: 42,
      customerId: 'c-x',
    });

    expect(
      host.notifications.getSent().some(
        (m) => m.channel === 'echo' && m.message.includes('o-echo') && m.message.includes('42'),
      ),
    ).toBe(true);

    await engine.dispose();
  });

  it('denies billing when capability is missing (billing_denied.lua)', async () => {
    const host = createDefaultBusinessHost([{ id: 'o-2', customerId: 'c-2', totalCents: 5000 }]);
    const engine = new BusinessScriptingEngine(host);

    await loadScript(engine,
      'no-billing-cap',
      readComponentLua('components/billing_denied.lua'),
      surface.pickCapabilities('orders:read'),
    );

    await expect(
      engine.dispatch({
        kind: 'OrderPlaced',
        orderId: 'o-2',
        amountCents: 10,
        customerId: 'c-2',
      }),
    ).rejects.toThrow(/capability denied/);

    await engine.dispose();
  });

  it('dispatches the same OrderPlaced hook to every script (separate Lua slots, separate allowlists)', async () => {
    const host = createDefaultBusinessHost([{ id: 'o-multi', customerId: 'c-m', totalCents: 1 }]);
    const engine = new BusinessScriptingEngine(host);
    const auditCaps = surface.pickCapabilities('audit:record');

    await loadScript(engine,
      'audit-a',
      readComponentLua('components/order_audit_alpha.lua'),
      auditCaps,
    );
    await loadScript(engine,
      'audit-b',
      readComponentLua('components/order_audit_beta.lua'),
      auditCaps,
    );

    await engine.dispatch({
      kind: 'OrderPlaced',
      orderId: 'o-multi',
      amountCents: 7,
      customerId: 'c-m',
    });

    const lines = host.audit.getLines();
    expect(lines.some((l) => l === 'alpha:o-multi')).toBe(true);
    expect(lines.some((l) => l === 'beta:o-multi')).toBe(true);

    await engine.dispose();
  });

  it('dispatches InventoryLow to two scripts that share inventory + audit bridges', async () => {
    const host = createDefaultBusinessHost([], { GADGET: 42 });
    const engine = new BusinessScriptingEngine(host);
    const caps = surface.pickCapabilities('inventory:read', 'audit:record');

    await loadScript(engine,'inv-a', readComponentLua('components/inventory_low_audit_a.lua'), caps);
    await loadScript(engine,'inv-b', readComponentLua('components/inventory_low_audit_b.lua'), caps);

    await engine.dispatch({ kind: 'InventoryLow', sku: 'GADGET', unitsLeft: 2 });

    const lines = host.audit.getLines();
    expect(lines.some((l) => l === 'inv-a:GADGET:units=42')).toBe(true);
    expect(lines.some((l) => l === 'inv-b:GADGET:units=42')).toBe(true);

    await engine.dispose();
  });

  it('fails the whole emit when one script is missing a capability its chunk uses', async () => {
    const host = createDefaultBusinessHost([{ id: 'o-cap', customerId: 'c-c', totalCents: 1 }]);
    const engine = new BusinessScriptingEngine(host);

    await loadScript(engine,
      'has-audit',
      readComponentLua('components/order_audit_alpha.lua'),
      surface.pickCapabilities('audit:record'),
    );
    await loadScript(engine,
      'no-audit',
      readComponentLua('components/order_audit_beta.lua'),
      surface.pickCapabilities(),
    );

    await expect(
      engine.dispatch({
        kind: 'OrderPlaced',
        orderId: 'o-cap',
        amountCents: 1,
        customerId: 'c-c',
      }),
    ).rejects.toThrow(/capability denied/);

    await engine.dispose();
  });

  it('sharedLuaChunks: every script sees the shared library without per-script prelude', async () => {
    const host = createDefaultBusinessHost([{ id: 'o-pre', customerId: 'c-p', totalCents: 1 }]);
    const engine = createEngineWithSharedMathLib(host);
    await loadScript(engine,
      'prelude-demo',
      readComponentLua('components/order_with_math_prelude.lua'),
      surface.pickCapabilities('audit:record'),
    );
    await engine.dispatch({
      kind: 'OrderPlaced',
      orderId: 'o-pre',
      amountCents: 100,
      customerId: 'c-p',
    });
    expect(host.audit.getLines().some((l) => l === 'prelude-sum:101:order:o-pre')).toBe(true);
    await engine.dispose();
  });

  it('two scripts on the same microverse both use sharedLuaChunks without repeating registration', async () => {
    const host = createDefaultBusinessHost([
      { id: 'o-a', customerId: 'c-a', totalCents: 1 },
      { id: 'o-b', customerId: 'c-b', totalCents: 1 },
    ]);
    const engine = createEngineWithSharedMathLib(host);
    await loadScript(engine,
      'wf-a',
      readComponentLua('components/order_with_math_prelude.lua'),
      surface.pickCapabilities('audit:record'),
    );
    await loadScript(engine,
      'wf-b',
      readComponentLua('components/order_with_math_prelude.lua'),
      surface.pickCapabilities('audit:record'),
    );
    await engine.dispatch({
      kind: 'OrderPlaced',
      orderId: 'o-a',
      amountCents: 10,
      customerId: 'c-a',
    });
    expect(host.audit.getLines().filter((l) => l.includes('prelude-sum:11:order:o-a')).length).toBe(2);
    await engine.dispose();
  });

  it('mountScriptInstance injectLuaChunks runs a per-script prelude in the slot', async () => {
    const host = createDefaultBusinessHost([{ id: 'o-inj', customerId: 'c-i', totalCents: 1 }]);
    const engine = new BusinessScriptingEngine(host);
    await loadScript(engine,
      'inject-prelude',
      readComponentLua('components/order_with_math_prelude.lua'),
      surface.pickCapabilities('audit:record'),
      { injectLuaChunks: [MATH_LIB] },
    );
    await engine.dispatch({
      kind: 'OrderPlaced',
      orderId: 'o-inj',
      amountCents: 200,
      customerId: 'c-i',
    });
    expect(host.audit.getLines().some((l) => l === 'prelude-sum:201:order:o-inj')).toBe(true);
    await engine.dispose();
  });

  it('async bridge: Lua uses :await() on asyncio:tick handle', async () => {
    const host = createDefaultBusinessHost([{ id: 'o-io', customerId: 'c-io', totalCents: 1 }]);
    const engine = new BusinessScriptingEngine(host);
    await loadScript(engine,
      'asyncio-demo',
      readComponentLua('components/order_asyncio_tick.lua'),
      surface.pickCapabilities('audit:record', 'asyncio:tick'),
    );
    await engine.dispatch({
      kind: 'OrderPlaced',
      orderId: 'o-io',
      amountCents: 10,
      customerId: 'c-io',
    });
    expect(host.audit.getLines().some((l) => l === 'asyncio-value:17:order:o-io')).toBe(true);
    await engine.dispose();
  });

  it('async partner pattern: sync jobs:create then host emitHook(JobDone)', async () => {
    const host = createDefaultBusinessHost([{ id: 'o-async', customerId: 'c-a', totalCents: 1 }]);
    const engine = new BusinessScriptingEngine(host);
    await loadScript(engine,
      'job-partner',
      readComponentLua('components/job_async_partner.lua'),
      surface.pickCapabilities('audit:record', 'jobs:create'),
    );
    await engine.dispatch({
      kind: 'OrderPlaced',
      orderId: 'o-async',
      amountCents: 1,
      customerId: 'c-a',
    });
    const linesAfterOrder = host.audit.getLines();
    expect(linesAfterOrder.some((l) => l === 'job-started:job-1:order:o-async')).toBe(true);

    await new Promise((r) => setTimeout(r, 5));
    await engine.emitHook('JobDone', { jobId: 'job-1', result: 99 });

    expect(host.audit.getLines().some((l) => l === 'job-finished:job-1:result:99')).toBe(true);
    await engine.dispose();
  });

  it('stateful Lua component pattern: local state across hook invocations in one slot', async () => {
    const host = createDefaultBusinessHost([{ id: 'o-c1', customerId: 'c-c', totalCents: 1 }]);
    const engine = new BusinessScriptingEngine(host);
    await loadScript(engine,
      'counter',
      readComponentLua('components/stateful_counter.lua'),
      surface.pickCapabilities('audit:record'),
    );
    await engine.dispatch({
      kind: 'OrderPlaced',
      orderId: 'o-c1',
      amountCents: 1,
      customerId: 'c-c',
    });
    await engine.dispatch({
      kind: 'OrderPlaced',
      orderId: 'o-c1',
      amountCents: 2,
      customerId: 'c-c',
    });
    const lines = host.audit.getLines();
    expect(lines.some((l) => l === 'counter:n=1:id=o-c1')).toBe(true);
    expect(lines.some((l) => l === 'counter:n=2:id=o-c1')).toBe(true);
    await engine.dispose();
  });
});

describe('Build-time LuaCATS (generated/businessSurface.d.lua)', () => {
  it('is produced by pnpm run generate:defs (pretest) and documents bridge methods + component event types', () => {
    const doc = readFileSync(generatedDefsPath, 'utf8');
    expect(doc).toContain('---@field get fun(self: Orders, payload: { orderId: OrderId }): OrderDto|nil');
    expect(doc).not.toContain('function Orders:get');
    expect(doc).toContain('---@field charge fun(self: Billing');
    expect(doc).toContain('---@field send fun(self: Notifications');
    expect(doc).toContain('---@field record fun(self: Audit');
    expect(doc).toContain('---@field getUnits fun(self: Inventory');
    expect(doc).toContain('---@class Asyncio');
    expect(doc).toContain('---@class AsyncioTickHandle');
    expect(doc).toContain('---@field tick fun(self: Asyncio');
    expect(doc).toContain('---@alias AsyncioTickResult');
    expect(doc).toContain('---@class Jobs');
    expect(doc).toContain('---@field create fun(self: Jobs');
    expect(doc).toContain('---@alias JobCreateResult');
    expect(doc).toContain('---@alias InventoryUnits');
    expect(doc).toContain('---@class MicroverseEvt_OrderPlaced');
    expect(doc).toContain('---@field orderId string');
    expect(doc).toContain('---@field amountCents number');
    expect(doc).toContain('---@field customerId string');
    expect(doc).toContain('---@class MicroverseEvt_InventoryLow');
    expect(doc).toContain('---@field sku string');
    expect(doc).toContain('---@field unitsLeft number');
    expect(doc).toContain('---@class Component');
    expect(doc).not.toContain('---@class Workflow');
    expect(doc).not.toContain('workflow = {}');
    expect(doc).toContain('---@class component');
    expect(doc).toContain('function component:extend()');
    expect(doc).toContain('---@type Component');
    expect(doc).toContain('---@return Component');
    expect(doc).toContain('---@field bridges MicroverseBridges');
    expect(doc).toContain('---@field onOrderPlaced');
    expect(doc).toContain('fun(self: Component, evt: MicroverseEvt_OrderPlaced)');
    expect(doc).toContain('---@field onInventoryLow');
    expect(doc).toContain('fun(self: Component, evt: MicroverseEvt_InventoryLow)');
    expect(doc).toContain('---@class MicroverseEvt_JobDone');
    expect(doc).toContain('---@field jobId string');
    expect(doc).toContain('---@field result number');
    expect(doc).toContain('---@field onJobDone');
    expect(doc).toContain('fun(self: Component, evt: MicroverseEvt_JobDone)');
    expect(doc).toContain('---@field onDestroy');
    expect(doc).toContain('---@alias OrderId string');
    expect(doc).not.toContain('Orders = {}');
    expect(doc).not.toContain('function onOrderPlaced(evt) end');
  });
});
