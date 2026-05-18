import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { validateWithZodSchema, ZodContractValidator } from './ZodContractValidator';

describe('validateWithZodSchema', () => {
  it('parses payloads', () => {
    const schema = z.object({ n: z.number() });
    const okResult = validateWithZodSchema(schema, { n: 1 });
    expect(okResult._tag).toBe('ok');
    const bad = validateWithZodSchema(schema, { n: 'x' });
    expect(bad._tag).toBe('err');
  });
});

describe('ZodContractValidator', () => {
  it('delegates to provided validator fn', () => {
    const v = new ZodContractValidator();
    const schema = z.string();
    const result = v.validate('hello', (payload) => validateWithZodSchema(schema, payload));
    expect(result._tag).toBe('ok');
  });
});
