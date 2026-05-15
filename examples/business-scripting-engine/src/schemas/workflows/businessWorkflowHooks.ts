import { z } from 'zod';

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

export type BusinessWorkflowHooksSpec = typeof businessWorkflowHooks;
