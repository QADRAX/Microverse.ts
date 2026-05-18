export type ScriptPropertyScalar = string | number | boolean | null;

export type ScriptPropertyValue =
  | ScriptPropertyScalar
  | readonly ScriptPropertyValue[]
  | { readonly [key: string]: ScriptPropertyValue };

export type ScriptPropertyBag = Readonly<Record<string, ScriptPropertyValue>>;

export type MutableScriptPropertyBag = Record<string, ScriptPropertyValue>;
