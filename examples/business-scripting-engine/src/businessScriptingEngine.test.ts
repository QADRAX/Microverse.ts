import { cap } from '@luarizer/luarizer';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { BusinessScriptingEngine } from './BusinessScriptingEngine.js';
import { createDefaultBusinessHost, readWorkflowLua } from './services/index.js';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const generatedDefsPath = join(packageRoot, 'generated', 'businessSurface.d.lua');

describe('BusinessScriptingEngine (Lua files under lua/)', () => {
  it('loads promotions.lua and reacts to domain events', async () => {
    const host = createDefaultBusinessHost([
      { id: 'o-1', customerId: 'c-1', totalCents: 2000 },
    ]);
    const engine = new BusinessScriptingEngine(host);

    await engine.registerWorkflow('promotions', readWorkflowLua('workflows/promotions.lua'), [
      cap('orders:read'),
      cap('billing:charge'),
      cap('notifications:send'),
    ]);

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

    await engine.registerWorkflow('echo', readWorkflowLua('workflows/order_echo.lua'), [
      cap('notifications:send'),
    ]);

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

    await engine.registerWorkflow('no-billing-cap', readWorkflowLua('workflows/billing_denied.lua'), [
      cap('orders:read'),
    ]);

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

  it('dispatches the same OrderPlaced hook to every workflow (separate Lua slots, separate allowlists)', async () => {
    const host = createDefaultBusinessHost([{ id: 'o-multi', customerId: 'c-m', totalCents: 1 }]);
    const engine = new BusinessScriptingEngine(host);
    const auditCap = cap('audit:record');

    await engine.registerWorkflow('audit-a', readWorkflowLua('workflows/order_audit_alpha.lua'), [auditCap]);
    await engine.registerWorkflow('audit-b', readWorkflowLua('workflows/order_audit_beta.lua'), [auditCap]);

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

  it('dispatches InventoryLow to two workflows that share inventory + audit bridges', async () => {
    const host = createDefaultBusinessHost([], { GADGET: 42 });
    const engine = new BusinessScriptingEngine(host);
    const caps = [cap('inventory:read'), cap('audit:record')];

    await engine.registerWorkflow('inv-a', readWorkflowLua('workflows/inventory_low_audit_a.lua'), caps);
    await engine.registerWorkflow('inv-b', readWorkflowLua('workflows/inventory_low_audit_b.lua'), caps);

    await engine.dispatch({ kind: 'InventoryLow', sku: 'GADGET', unitsLeft: 2 });

    const lines = host.audit.getLines();
    expect(lines.some((l) => l === 'inv-a:GADGET:units=42')).toBe(true);
    expect(lines.some((l) => l === 'inv-b:GADGET:units=42')).toBe(true);

    await engine.dispose();
  });

  it('fails the whole emit when one workflow is missing a capability its script uses', async () => {
    const host = createDefaultBusinessHost([{ id: 'o-cap', customerId: 'c-c', totalCents: 1 }]);
    const engine = new BusinessScriptingEngine(host);

    await engine.registerWorkflow('has-audit', readWorkflowLua('workflows/order_audit_alpha.lua'), [cap('audit:record')]);
    await engine.registerWorkflow('no-audit', readWorkflowLua('workflows/order_audit_beta.lua'), []);

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
});

describe('Build-time LuaCATS (generated/businessSurface.d.lua)', () => {
  it('is produced by pnpm run generate:defs (pretest) and documents bridge methods + workflow hook types', () => {
    const doc = readFileSync(generatedDefsPath, 'utf8');
    expect(doc).toContain('function orders:get(payload) end');
    expect(doc).toContain('function billing:charge(payload) end');
    expect(doc).toContain('function notifications:send(payload) end');
    expect(doc).toContain('function audit:record(payload) end');
    expect(doc).toContain('function inventory:getUnits(payload) end');
    expect(doc).toContain('---@alias InventoryUnits');
    expect(doc).toContain('---@class LuarizerWorkflowEvt_OrderPlaced');
    expect(doc).toContain('---@field orderId string');
    expect(doc).toContain('---@field amountCents number');
    expect(doc).toContain('---@field customerId string');
    expect(doc).toContain('---@class LuarizerWorkflowEvt_InventoryLow');
    expect(doc).toContain('---@field sku string');
    expect(doc).toContain('---@field unitsLeft number');
    expect(doc).toContain('---@class Workflow');
    expect(doc).not.toContain('Workflow = {}');
    expect(doc).toContain('---@class workflow');
    expect(doc).toContain('workflow = {}');
    expect(doc).toContain('function workflow:extend() end');
    expect(doc).toContain('---@return Workflow');
    expect(doc).toContain('---@field onOrderPlaced');
    expect(doc).toContain('fun(self: Workflow, evt: LuarizerWorkflowEvt_OrderPlaced)');
    expect(doc).toContain('---@field onInventoryLow');
    expect(doc).toContain('fun(self: Workflow, evt: LuarizerWorkflowEvt_InventoryLow)');
    expect(doc).toContain('---@alias OrderId string');
    expect(doc).toContain('orders = {}');
    expect(doc).not.toContain('function onOrderPlaced(evt) end');
  });
});
