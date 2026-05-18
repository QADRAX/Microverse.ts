import { z } from 'zod';

export const chessComponentHooks = {
  PickMove: z.object({
    ply: z.number().int().nonnegative(),
    /** Times the current position has already occurred (1 = first time). */
    positionRepeats: z.number().int().positive(),
    lastFrom: z.string().optional(),
    lastTo: z.string().optional(),
  }),
  Reset: z.object({ fen: z.string() }),
} as const;

export type ChessComponentHooksSpec = typeof chessComponentHooks;
