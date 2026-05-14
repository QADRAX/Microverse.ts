export type SandboxId = string & { readonly __brand: 'SandboxId' };

export function createSandboxId(value: string): SandboxId {
  return value as SandboxId;
}

/**
 * Branded id for **one Lua environment slot** (`_ENV`) inside a shared Wasm VM — same value as {@link createSandboxId},
 * wording aimed at host/workflow code (pairs with {@link SandboxRuntime.createSandbox}'s `slotKey`).
 */
export function createLuaEnvSlotKey(label: string): SandboxId {
  return createSandboxId(label);
}
