/** Minimal JSON Schema → LuaCATS for protocol export (primitives only; overlays preferred). */
export function jsonSchemaToLuaTypeRef(schema: unknown): string {
  if (schema === null || typeof schema !== 'object') {
    return 'unknown';
  }
  const s = schema as Record<string, unknown>;
  if (Array.isArray(s.enum)) {
    return s.enum.map((v) => JSON.stringify(v)).join('|');
  }
  const type = s.type;
  if (type === 'string') return 'string';
  if (type === 'boolean') return 'boolean';
  if (type === 'integer') return 'integer';
  if (type === 'number') return 'number';
  if (type === 'null') return 'nil';
  if (type === 'array') {
    const items = s.items;
    if (items !== undefined) {
      return `${jsonSchemaToLuaTypeRef(items)}[]`;
    }
    return 'table';
  }
  if (type === 'object' && s.properties !== undefined && typeof s.properties === 'object') {
    const props = s.properties as Record<string, unknown>;
    const keys = Object.keys(props).sort((a, b) => a.localeCompare(b));
    if (keys.length === 0) {
      return 'table';
    }
    const parts = keys.map((k) => `${k}: ${jsonSchemaToLuaTypeRef(props[k])}`);
    return `{ ${parts.join('; ')} }`;
  }
  if (Array.isArray(s.anyOf)) {
    return (s.anyOf as unknown[]).map((o) => jsonSchemaToLuaTypeRef(o)).join('|');
  }
  if (Array.isArray(s.oneOf)) {
    return (s.oneOf as unknown[]).map((o) => jsonSchemaToLuaTypeRef(o)).join('|');
  }
  return 'unknown';
}
