import { describe, expect, it } from 'vitest';

import { assertSafeObjectKey } from './safeObjectKey.js';

describe('assertSafeObjectKey', () => {
  it('rejects prototype-pollution keys', () => {
    expect(() => assertSafeObjectKey('bridge', '__proto__')).toThrow(/reserved key/);
    expect(() => assertSafeObjectKey('method', 'constructor')).toThrow(/reserved key/);
    expect(() => assertSafeObjectKey('method', 'prototype')).toThrow(/reserved key/);
  });

  it('allows normal bridge and method names', () => {
    expect(() => assertSafeObjectKey('bridge', 'orders')).not.toThrow();
    expect(() => assertSafeObjectKey('method', 'get')).not.toThrow();
  });
});
