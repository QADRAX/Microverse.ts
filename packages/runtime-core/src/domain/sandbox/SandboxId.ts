export type SandboxId = string & { readonly __brand: 'SandboxId' };

export function createSandboxId(value: string): SandboxId {
  return value as SandboxId;
}
