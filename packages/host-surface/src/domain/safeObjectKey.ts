/** Keys that must not be used as dynamic property names on ordinary objects. */
const FORBIDDEN_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Rejects bridge/method names that could trigger prototype pollution when used as object keys.
 */
export function assertSafeObjectKey(kind: 'bridge' | 'method', name: string): void {
  if (FORBIDDEN_OBJECT_KEYS.has(name)) {
    throw new Error(`Invalid surface ${kind} name "${name}": reserved key`);
  }
}

/** Record with no inherited prototype — safe for dynamic string keys at runtime. */
export function createNullPrototypeRecord<T extends object>(): T {
  return Object.create(null) as T;
}
