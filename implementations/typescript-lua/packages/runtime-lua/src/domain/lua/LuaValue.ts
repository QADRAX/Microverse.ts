export type LuaValue =
  | { readonly _tag: 'nil' }
  | { readonly _tag: 'bool'; readonly value: boolean }
  | { readonly _tag: 'number'; readonly value: number }
  | { readonly _tag: 'string'; readonly value: string }
  | { readonly _tag: 'table'; readonly keys: readonly string[] };
