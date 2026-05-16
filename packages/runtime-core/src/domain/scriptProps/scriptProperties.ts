import type { MutableScriptPropertyBag, ScriptPropertyBag, ScriptPropertyValue } from './ScriptPropertyValue.js';

export function shallowEqualScriptPropertyValue(
  a: ScriptPropertyValue | undefined,
  b: ScriptPropertyValue | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  if (typeof a !== typeof b) {
    return false;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!shallowEqualScriptPropertyValue(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  if (typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const aObj = a as { readonly [key: string]: ScriptPropertyValue };
    const bObj = b as { readonly [key: string]: ScriptPropertyValue };
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    for (const key of aKeys) {
      if (!shallowEqualScriptPropertyValue(aObj[key], bObj[key])) {
        return false;
      }
    }
    return true;
  }

  return false;
}

/**
 * Returns keys whose values changed between two property bags (shallow per key).
 */
export function diffScriptProperties(prev: ScriptPropertyBag, next: ScriptPropertyBag): string[] {
  const changed: string[] = [];

  for (const key of Object.keys(next)) {
    if (!shallowEqualScriptPropertyValue(prev[key], next[key])) {
      changed.push(key);
    }
  }

  for (const key of Object.keys(prev)) {
    if (!(key in next)) {
      changed.push(key);
    }
  }

  return changed;
}

/** Applies changed keys from `source` into `target`. */
export function applyScriptPropertyChanges(
  target: MutableScriptPropertyBag,
  source: ScriptPropertyBag,
  changedKeys: ReadonlyArray<string>,
): void {
  for (const key of changedKeys) {
    if (key in source) {
      target[key] = source[key]!;
    } else {
      delete target[key];
    }
  }
}

export function mergeScriptPropertyBags(
  base: ScriptPropertyBag,
  override: ScriptPropertyBag,
): MutableScriptPropertyBag {
  return { ...base, ...override };
}
