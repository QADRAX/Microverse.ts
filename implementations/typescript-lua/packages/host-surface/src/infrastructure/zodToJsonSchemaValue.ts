import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/** Converts Zod schemas to JSON Schema for {@link SurfaceSpecDocument} export. */
export function zodToJsonSchemaValue(schema: z.ZodTypeAny): unknown {
  return zodToJsonSchema(schema as z.ZodType, {
    $refStrategy: 'none',
    target: 'jsonSchema7',
  });
}
