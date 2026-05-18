import type { ScriptPropertyBag, ScriptPropertyValue } from '@microverse.ts/runtime-core';

export function scriptPropertyBagToMergeEnv(bag: ScriptPropertyBag): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(bag)) {
    out[k] = scriptPropertyValueToPlain(v);
  }
  return out;
}

export function scriptPropertyValueToPlain(value: ScriptPropertyValue): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    const items = value as readonly ScriptPropertyValue[];
    return items.map((item) => scriptPropertyValueToPlain(item));
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = scriptPropertyValueToPlain(v);
  }
  return out;
}

export function mergeEnvSinkToScriptPropertyBag(
  sink: Record<string, unknown>,
): ScriptPropertyBag {
  const out: Record<string, ScriptPropertyValue> = {};
  for (const [k, v] of Object.entries(sink)) {
    const converted = plainToScriptPropertyValue(v);
    if (converted !== undefined) {
      out[k] = converted;
    }
  }
  return out;
}

export function plainToScriptPropertyValue(value: unknown): ScriptPropertyValue | undefined {
  if (value === null) {
    return null;
  }
  const t = typeof value;
  if (t === 'string' || t === 'boolean') {
    return value as string | boolean;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (Array.isArray(value)) {
    const arr: ScriptPropertyValue[] = [];
    for (const item of value) {
      const c = plainToScriptPropertyValue(item);
      if (c !== undefined) {
        arr.push(c);
      }
    }
    return arr;
  }
  if (t === 'object' && value !== null) {
    const obj: Record<string, ScriptPropertyValue> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const c = plainToScriptPropertyValue(v);
      if (c !== undefined) {
        obj[k] = c;
      }
    }
    return obj;
  }
  return undefined;
}
