import type { z } from 'zod';

export type BridgeContractSchema<T> = {
  readonly name: string;
  readonly schema: z.ZodType<T>;
};
