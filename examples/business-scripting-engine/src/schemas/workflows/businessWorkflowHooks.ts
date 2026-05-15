import { z } from 'zod';

/** Zod payloads for workflow Lua hooks (`onOrderPlaced` on the table from `workflow:extend()`, …); drives `.d.lua` + LuaLS in `lua/workflows`. */
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
  /** Fired from TypeScript when async host work completes (see `emitWorkflowHook`). */
  JobDone: z.object({
    jobId: z.string(),
    result: z.number(),
  }),
} as const;

export type BusinessWorkflowHooksSpec = typeof businessWorkflowHooks;
