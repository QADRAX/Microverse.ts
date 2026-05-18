import { describe, expect, it } from 'vitest';

import { err, isErr, isOk, ok } from './Result';

describe('Result', () => {
  it('narrows ok', () => {
    const r = ok(1);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) {
      expect(r.value).toBe(1);
    }
  });

  it('narrows err', () => {
    const r = err('x');
    expect(isErr(r)).toBe(true);
    if (isErr(r)) {
      expect(r.error).toBe('x');
    }
  });
});
