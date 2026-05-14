import { err, ok, type Result } from '@luarizer/shared';
import type { z } from 'zod';

import type { ContractValidatorPort } from '../../application/ports/ContractValidatorPort';

export class ZodContractValidator implements ContractValidatorPort {
  readonly validate = <T>(
    payload: unknown,
    validate: (value: unknown) => Result<T, string>,
  ): Result<T, string> => {
    return validate(payload);
  };
}

export function validateWithZodSchema<T>(schema: z.ZodType<T>, payload: unknown): Result<T, string> {
  const parsed = schema.safeParse(payload);
  return parsed.success ? ok(parsed.data) : err(parsed.error.message);
}
