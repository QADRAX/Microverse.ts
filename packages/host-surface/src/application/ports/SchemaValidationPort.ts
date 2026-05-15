import type { Result } from '@microverse/shared';
import type { z } from 'zod';

/**
 * Validates unknown payloads against Zod schemas (bridge IO, etc.).
 */
export type SchemaValidationPort = {
  readonly validateWithZodSchema: <T>(schema: z.ZodType<T>, payload: unknown) => Result<T, string>;
};
