import { z } from 'zod';

import type { ScriptProfileDefInput } from '@microverse.ts/microverse-lua';

/** Single script profile shared by every chess engine in the catalog. */
export const CHESS_ENGINE_PROFILE = {
  capabilities: ['board:read', 'play:move', 'viz:emit', 'game:read'],
  props: z.object({
    label: z.string(),
    color: z.enum(['white', 'black']),
  }),
  state: z.object({
    i: z.number().int().optional(),
    j: z.number().int().optional(),
    bestScore: z.number().optional(),
    bestFrom: z.string().optional(),
    bestTo: z.string().optional(),
    bestPromotion: z.string().optional(),
    phase: z.string().optional(),
    done: z.boolean().optional(),
  }),
  hooks: ['PickMove', 'Reset'],
} as const satisfies ScriptProfileDefInput;
