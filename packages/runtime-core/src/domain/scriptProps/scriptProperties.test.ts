import { describe, expect, it } from 'vitest';

import {
  applyScriptPropertyChanges,
  diffScriptProperties,
  mergeScriptPropertyBags,
  shallowEqualScriptPropertyValue,
} from './scriptProperties.js';
import { assertValidScriptPropertyBag } from './scriptPropertyLimits.js';

describe('scriptProperties', () => {
  it('diffScriptProperties detects scalar and nested changes', () => {
    const prev = { speed: 1, nested: { x: 1 } };
    const next = { speed: 2, nested: { x: 1 } };
    expect(diffScriptProperties(prev, next)).toEqual(['speed']);
  });

  it('diffScriptProperties detects removed keys', () => {
    const prev = { a: 1, b: 2 };
    const next = { a: 1 };
    expect(diffScriptProperties(prev, next)).toContain('b');
  });

  it('applyScriptPropertyChanges updates target', () => {
    const target: Record<string, unknown> = { a: 1, b: 2 };
    applyScriptPropertyChanges(target, { a: 10 }, ['a']);
    expect(target.a).toBe(10);
  });

  it('shallowEqualScriptPropertyValue compares arrays', () => {
    expect(shallowEqualScriptPropertyValue([1, 2], [1, 2])).toBe(true);
    expect(shallowEqualScriptPropertyValue([1, 2], [1, 3])).toBe(false);
  });

  it('mergeScriptPropertyBags overlays override', () => {
    expect(mergeScriptPropertyBags({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
  });
});

describe('scriptPropertyLimits', () => {
  it('assertValidScriptPropertyBag accepts nested JSON-like values', () => {
    expect(() =>
      assertValidScriptPropertyBag({
        vec: { x: 1, y: 2 },
        tags: ['a', 'b'],
        ok: true,
        n: null,
      }),
    ).not.toThrow();
  });

  it('rejects non-finite numbers', () => {
    expect(() => assertValidScriptPropertyBag({ x: Number.NaN })).toThrow();
  });
});
