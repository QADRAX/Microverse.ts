import { luaType } from '@microverse/microverse-lua';
import { z } from 'zod';

export const orderId = luaType('OrderId', z.string());

export const orderDto = luaType(
  'OrderDto',
  z.object({
    id: z.string(),
    customerId: z.string(),
    totalCents: z.number(),
  }),
);

export const chargeResult = luaType(
  'ChargeResult',
  z.object({
    ok: z.boolean(),
  }),
);

export const inventoryUnitsDto = luaType(
  'InventoryUnits',
  z.object({
    units: z.number(),
  }),
);

export const jobCreateResult = luaType(
  'JobCreateResult',
  z.object({
    jobId: z.string(),
  }),
);

export const asyncioTickResult = luaType(
  'AsyncioTickResult',
  z.object({
    value: z.number(),
  }),
);
