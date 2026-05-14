import { cap, defineHostSurface, fn } from '@luarizer/luarizer';
import { z } from 'zod';

import type { BusinessEngineHost, OrderRecord } from './integrations.js';

const orderDto = z.object({
  id: z.string(),
  customerId: z.string(),
  totalCents: z.number(),
});

const chargeResult = z.object({
  ok: z.boolean(),
});

/** Zod payloads for workflow Lua hooks (`onOrderPlaced`, …); drives `.d.lua` + LuaLS in `lua/workflows`. */
export const businessWorkflowHooks = {
  OrderPlaced: z.object({
    orderId: z.string(),
    amountCents: z.number(),
    customerId: z.string(),
  }),
  InventoryLow: z.object({
    sku: z.string(),
    unitsLeft: z.number(),
  }),
} as const;

/**
 * Host surface exposed to Lua: domain integrations with Zod + capabilities.
 * Each workflow session declares only the capabilities it needs in its allowlist.
 *
 * Default-exported for `luarizer generate-defs --surface ...` (see package.json).
 */
export default defineHostSurface(
  {
    orders: {
      get: fn<BusinessEngineHost, { orderId: string }, OrderRecord | undefined>({
        capability: cap('orders:read'),
        input: z.object({ orderId: z.string() }),
        output: orderDto.optional(),
        description: 'Load order by id',
        lua: { paramTypes: { orderId: 'OrderId' }, returns: 'OrderDto|nil' },
        handler: ({ host }, { orderId }) => host.orders.get(orderId),
      }),
    },
    billing: {
      charge: fn<BusinessEngineHost, { orderId: string; amountCents: number }, { ok: boolean }>({
        capability: cap('billing:charge'),
        input: z.object({
          orderId: z.string(),
          amountCents: z.number().int().nonnegative(),
        }),
        output: chargeResult,
        description: 'Record a charge against an order',
        lua: { paramTypes: { orderId: 'OrderId', amountCents: 'integer' }, returns: 'ChargeResult' },
        handler: ({ host }, input) => host.billing.charge(input.orderId, input.amountCents),
      }),
    },
    notifications: {
      send: fn<BusinessEngineHost, { channel: string; message: string }, undefined>({
        capability: cap('notifications:send'),
        input: z.object({ channel: z.string(), message: z.string() }),
        output: z.undefined(),
        description: 'Send a notification (email, slack, …)',
        handler: ({ host }, input) => {
          host.notifications.send(input.channel, input.message);
          return undefined;
        },
      }),
    },
  },
  businessWorkflowHooks,
);
