export type ToyEntityId = string & { readonly __brand: 'ToyEntityId' };

export function createToyEntityId(value: string): ToyEntityId {
  return value as ToyEntityId;
}

/** Subconjunto de hooks que el demo reconoce (Duck tiene más). */
export const TOY_SCRIPT_HOOKS = [
  'init',
  'onEnable',
  'update',
  'onDisable',
  'onDestroy',
] as const;

export type ToyScriptHook = (typeof TOY_SCRIPT_HOOKS)[number];
