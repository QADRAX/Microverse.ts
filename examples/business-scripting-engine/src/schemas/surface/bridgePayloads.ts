import { z } from 'zod';

export const orderDto = z.object({
  id: z.string(),
  customerId: z.string(),
  totalCents: z.number(),
});

export const chargeResult = z.object({
  ok: z.boolean(),
});

export const inventoryUnitsDto = z.object({
  units: z.number(),
});

export const jobCreateResult = z.object({
  jobId: z.string(),
});

export const asyncioTickResult = z.object({
  value: z.number(),
});
