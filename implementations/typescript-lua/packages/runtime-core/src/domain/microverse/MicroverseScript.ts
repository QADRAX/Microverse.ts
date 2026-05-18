export type MicroverseScript = string & { readonly __brand: 'MicroverseScript' };

export function createMicroverseScript(source: string): MicroverseScript {
  return source as MicroverseScript;
}
