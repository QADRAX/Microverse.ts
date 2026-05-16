import { z } from 'zod';

/** Zod payloads for component domain events (`onOrderPlaced` on the table from `component:extend()`, …); drives `.d.lua` + LuaLS. */
export const businessComponentHooks = {
  OrderPlaced: z.object({
    orderId: z.string(),
    amountCents: z.number(),
    customerId: z.string(),
  }),
  InventoryLow: z.object({
    sku: z.string(),
    unitsLeft: z.number(),
  }),
  /** Fired from TypeScript when async host work completes (see {@link BusinessScriptingEngine.emitHook}). */
  JobDone: z.object({
    jobId: z.string(),
    result: z.number(),
  }),
} as const;

export type BusinessComponentHooksSpec = typeof businessComponentHooks;
