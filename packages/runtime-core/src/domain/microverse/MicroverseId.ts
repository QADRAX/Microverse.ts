export type MicroverseId = string & { readonly __brand: 'MicroverseId' };

export function createMicroverseId(value: string): MicroverseId {
  return value as MicroverseId;
}

/**
 * Branded id for **one Lua environment slot** (`_ENV`) inside a shared Wasm VM — same value as {@link createMicroverseId},
 * wording aimed at host/workflow code (pairs with {@link MicroverseRuntime.createMicroverse}'s `slotKey`).
 */
export function createLuaEnvSlotKey(label: string): MicroverseId {
  return createMicroverseId(label);
}
