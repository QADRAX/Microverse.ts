/** Reference field kinds for script property schemas (engine-agnostic). */
export type ScriptReferenceKind =
  | 'entityRef'
  | 'entityRefArray'
  | 'entityComponentRef'
  | 'entityComponentRefArray';

export type ScriptReferenceFieldDef =
  | { readonly kind: 'entityRef' }
  | { readonly kind: 'entityRefArray' }
  | {
      readonly kind: 'entityComponentRef';
      readonly componentType: string;
    }
  | {
      readonly kind: 'entityComponentRefArray';
      readonly componentType: string;
    };

/** Maps property keys to reference kinds (non-reference keys use Zod props only). */
export type ScriptReferenceFieldSchema = Readonly<Record<string, ScriptReferenceFieldDef>>;
