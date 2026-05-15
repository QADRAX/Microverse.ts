/**
 * Concatena fragmentos Lua en un solo chunk (prelude compartido + cuerpo del workflow).
 * Útil para “subrutinas” sin `require` en el VM: ver `docs/COMPONENT_PATTERN.md`.
 */
export function composeLuaChunk(parts: readonly string[]): string {
  return parts.map((p) => p.trim()).filter((p) => p.length > 0).join('\n\n');
}
