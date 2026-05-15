import { validateWithZodSchema } from '@luarizer/runtime-zod';

import type { SchemaValidationPort } from '../../application/ports/SchemaValidationPort.js';

export function createZodSchemaValidationPort(): SchemaValidationPort {
  return { validateWithZodSchema };
}
