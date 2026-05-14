import { cap } from '@luarizer/luarizer';
import { describe, expect, it } from 'vitest';

import { BusinessScriptingEngine } from './BusinessScriptingEngine.js';
import { createDefaultBusinessHost } from './integrations.js';

const WORKFLOW_LUA = `
function onOrderPlaced(evt)
  local o = orders.get({ orderId = evt.orderId })
  if o and o.totalCents >= 1000 then
    local amt = math.min(evt.amountCents, 1500)
    billing.charge({ orderId = evt.orderId, amountCents = amt })
    notifications.send({ channel = "audit", message = "charged for " .. evt.orderId })
  end
end

function onInventoryLow(evt)
  if evt.unitsLeft <= 2 then
    notifications.send({ channel = "ops", message = "low stock " .. evt.sku })
  end
end
`.trim();

describe('BusinessScriptingEngine (illustrative)', () => {
  it('runs Lua rules on domain events with API bridges and capabilities', async () => {
    const host = createDefaultBusinessHost([
      { id: 'o-1', customerId: 'c-1', totalCents: 2000 },
    ]);
    const engine = new BusinessScriptingEngine(host);

    await engine.registerWorkflow('promotions', WORKFLOW_LUA, [
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

  it('denies billing when capability is missing', async () => {
    const host = createDefaultBusinessHost([{ id: 'o-2', customerId: 'c-2', totalCents: 5000 }]);
    const engine = new BusinessScriptingEngine(host);

    const luaNoBilling = `
function onOrderPlaced(evt)
  billing.charge({ orderId = evt.orderId, amountCents = 1 })
end
`.trim();

    await engine.registerWorkflow('no-billing-cap', luaNoBilling, [cap('orders:read')]);

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
