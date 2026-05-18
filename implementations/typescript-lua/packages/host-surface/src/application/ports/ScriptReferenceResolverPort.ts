import type { ScriptReferenceKind } from '@microverse.ts/runtime-core';

export type ScriptReferenceWrapContext = {
  readonly slotKey: string;
  readonly field: string;
  readonly raw: string | null;
  readonly kind: ScriptReferenceKind;
  readonly componentType?: string | undefined;
};

/** Host-provided wrapper for `self.references.*` (opaque Lua userdata/table). */
export type ScriptReferenceResolverPort = {
  readonly wrap: (ctx: ScriptReferenceWrapContext) => unknown;
};
