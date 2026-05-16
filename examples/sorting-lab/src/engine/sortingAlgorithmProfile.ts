import { z } from 'zod';

import type { ScriptProfileDefInput } from '@microverse.ts/microverse-lua';

/** Single script profile shared by every sorting algorithm in the catalog. */
export const SORTING_ALGORITHM_PROFILE = {
  capabilities: ['array:read', 'array:write', 'viz:emit', 'sort:control'],
  props: z.object({
    label: z.string(),
    slotSide: z.enum(['A', 'B']),
  }),
  state: z.object({
    i: z.number().int().optional(),
    j: z.number().int().optional(),
    minJ: z.number().int().optional(),
    done: z.boolean().optional(),
    low: z.number().int().optional(),
    high: z.number().int().optional(),
    pivot: z.number().int().optional(),
    pIndex: z.number().int().optional(),
    stack: z.array(z.number().int()).optional(),
    gap: z.number().int().optional(),
    heapSize: z.number().int().optional(),
    swapped: z.boolean().optional(),
    buf: z.array(z.number().int()).optional(),
  }),
  hooks: ['Tick', 'Reset'],
} as const satisfies ScriptProfileDefInput;
