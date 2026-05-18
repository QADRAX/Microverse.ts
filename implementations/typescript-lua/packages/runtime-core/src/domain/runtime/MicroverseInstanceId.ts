/**
 * Opaque id for one **isolated** sandbox runtime instance in the host process.
 * Typical use: one id per entity, per script, or per worker — each maps to its own `MicroverseRuntime`.
 */
export type MicroverseInstanceId = string & { readonly __brand: 'MicroverseInstanceId' };

export function createMicroverseInstanceId(value: string): MicroverseInstanceId {
  return value as MicroverseInstanceId;
}
