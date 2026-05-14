/**
 * Opaque id for one **isolated** sandbox runtime instance in the host process.
 * Typical use: one id per entity, per script, or per worker — each maps to its own `SandboxRuntime`.
 */
export type SandboxInstanceId = string & { readonly __brand: 'SandboxInstanceId' };

export function createSandboxInstanceId(value: string): SandboxInstanceId {
  return value as SandboxInstanceId;
}
