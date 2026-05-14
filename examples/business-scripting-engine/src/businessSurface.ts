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

/**
 * Superficie expuesta a Lua: integraciones de dominio tipadas con Zod + capabilities.
 * Cada workflow declara en su manifiesto solo las capabilities que necesita.
 */
export const businessSurface = defineHostSurface({
  orders: {
    get: fn<BusinessEngineHost, { orderId: string }, OrderRecord | undefined>({
      capability: cap('orders:read'),
      input: z.object({ orderId: z.string() }),
      output: orderDto.optional(),
      description: 'Carga un pedido por id',
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
      description: 'Registra un cargo contra un pedido',
      lua: { paramTypes: { orderId: 'OrderId', amountCents: 'integer' }, returns: 'ChargeResult' },
      handler: ({ host }, input) => host.billing.charge(input.orderId, input.amountCents),
    }),
  },
  notifications: {
    send: fn<BusinessEngineHost, { channel: string; message: string }, undefined>({
      capability: cap('notifications:send'),
      input: z.object({ channel: z.string(), message: z.string() }),
      output: z.undefined(),
      description: 'Envía un aviso (email, slack, …)',
      handler: ({ host }, input) => {
        host.notifications.send(input.channel, input.message);
        return undefined;
      },
    }),
  },
});
