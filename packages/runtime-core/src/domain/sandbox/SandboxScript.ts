export type SandboxScript = string & { readonly __brand: 'SandboxScript' };

export function createSandboxScript(source: string): SandboxScript {
  return source as SandboxScript;
}
