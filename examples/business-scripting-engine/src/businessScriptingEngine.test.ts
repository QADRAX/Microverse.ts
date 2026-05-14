import { cap } from '@luarizer/luarizer';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { BusinessScriptingEngine } from './BusinessScriptingEngine.js';
import { createDefaultBusinessHost } from './integrations.js';
import { readWorkflowLua } from './loadWorkflowScript.js';

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
});

describe('Build-time LuaCATS (generated/businessSurface.d.lua)', () => {
  it('is produced by pnpm run generate:defs (pretest) and documents bridge methods', () => {
    const doc = readFileSync(generatedDefsPath, 'utf8');
    expect(doc).toContain('function orders:get');
    expect(doc).toContain('function billing:charge');
    expect(doc).toContain('function notifications:send');
    expect(doc).toContain('---@alias OrderId string');
    expect(doc).toContain('orders = {}');
  });
});
