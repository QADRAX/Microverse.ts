import { z } from 'zod';

export const sortingComponentHooks = {
  Tick: z.object({ step: z.number().int().nonnegative() }),
  Reset: z.object({ values: z.array(z.number().int()) }),
} as const;

export type SortingComponentHooksSpec = typeof sortingComponentHooks;
