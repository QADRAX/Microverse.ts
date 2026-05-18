import { validateWithZodSchema } from '@microverse.ts/runtime-zod';

import type { SchemaValidationPort } from '../../application/ports/SchemaValidationPort';

export function createZodSchemaValidationPort(): SchemaValidationPort {
  return { validateWithZodSchema };
}
