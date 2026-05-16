import type {
  MutableScriptPropertyBag,
  ScriptPropertyBag,
  ScriptPropertyValue,
} from './ScriptPropertyValue.js';

export type ScriptPropertyLimits = {
  readonly maxDepth?: number | undefined;
  readonly maxKeys?: number | undefined;
  readonly maxArrayLength?: number | undefined;
};

export const DEFAULT_SCRIPT_PROPERTY_LIMITS = {
  maxDepth: 16,
  maxKeys: 256,
  maxArrayLength: 1024,
} as const satisfies Required<ScriptPropertyLimits>;

export function assertValidScriptPropertyValue(
  value: unknown,
  limits: ScriptPropertyLimits = DEFAULT_SCRIPT_PROPERTY_LIMITS,
  depth = 0,
): asserts value is ScriptPropertyValue {
  const maxDepth: number = limits.maxDepth ?? DEFAULT_SCRIPT_PROPERTY_LIMITS.maxDepth;
  const maxKeys: number = limits.maxKeys ?? DEFAULT_SCRIPT_PROPERTY_LIMITS.maxKeys;
  const maxArrayLength: number =
    limits.maxArrayLength ?? DEFAULT_SCRIPT_PROPERTY_LIMITS.maxArrayLength;

  if (depth > maxDepth) {
    throw new Error(`script property exceeds max depth (${maxDepth})`);
  }

  if (value === null) {
    return;
  }

  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') {
    if (t === 'number' && !Number.isFinite(value as number)) {
      throw new Error('script property number must be finite');
    }
    return;
  }

  if (Array.isArray(value)) {
    if (value.length > maxArrayLength) {
      throw new Error(`script property array exceeds max length (${maxArrayLength})`);
    }
    for (const item of value) {
      assertValidScriptPropertyValue(item, limits, depth + 1);
    }
    return;
  }

  if (t === 'object' && value !== null && !Array.isArray(value)) {
    const keys = Object.keys(value as Record<string, unknown>);
    if (keys.length > maxKeys) {
      throw new Error(`script property object exceeds max keys (${maxKeys})`);
    }
    for (const key of keys) {
      assertValidScriptPropertyValue((value as Record<string, unknown>)[key], limits, depth + 1);
    }
    return;
  }

  throw new Error(`script property value type not allowed: ${t}`);
}

export function assertValidScriptPropertyBag(
  bag: unknown,
  limits?: ScriptPropertyLimits,
): asserts bag is Readonly<Record<string, ScriptPropertyValue>> {
  if (typeof bag !== 'object' || bag === null || Array.isArray(bag)) {
    throw new Error('script property bag must be a plain object');
  }
  const keys = Object.keys(bag);
  const maxKeys: number = limits?.maxKeys ?? DEFAULT_SCRIPT_PROPERTY_LIMITS.maxKeys;
  if (keys.length > maxKeys) {
    throw new Error(`script property bag exceeds max keys (${maxKeys})`);
  }
  for (const key of keys) {
    assertValidScriptPropertyValue((bag as Record<string, unknown>)[key], limits, 1);
  }
}

export function cloneScriptPropertyValue(value: ScriptPropertyValue): ScriptPropertyValue {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => cloneScriptPropertyValue(item));
  }
  const out: Record<string, ScriptPropertyValue> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = cloneScriptPropertyValue(v);
  }
  return out;
}

export function cloneScriptPropertyBag(bag: ScriptPropertyBag): MutableScriptPropertyBag {
  const out: MutableScriptPropertyBag = {};
  for (const [k, v] of Object.entries(bag)) {
    out[k] = cloneScriptPropertyValue(v);
  }
  return out;
}
