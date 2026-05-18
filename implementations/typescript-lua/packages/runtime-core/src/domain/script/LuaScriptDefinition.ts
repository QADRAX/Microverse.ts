import type { z } from 'zod';

import type { ScriptPropertyBag } from '../scriptProps/ScriptPropertyValue';
import type { ScriptProfileDefInput } from './scriptProfileDef';

export type LuaScriptSource = string | (() => string | Promise<string>);

/**
 * Script catalog entry for the **`lua@1`** profile (Wasmoon Lua, see `spec/README.md`).
 *
 * The type name is historical; it is not part of the language-neutral protocol document.
 * Other profiles may introduce parallel definition types in their host packages.
 */
export type LuaScriptDefinition = {
  readonly scriptId: string;
  readonly source: LuaScriptSource;
  /**
   * Resolved script profile id (matches a `.componentType()` / surface profile name).
   * Host applies this profile at mount before props/`init`.
   */
  readonly profileId?: string | undefined;
  /** Inline profile when not registered on the surface (advanced). */
  readonly profile?: ScriptProfileDefInput | undefined;
  readonly propsSchema?: z.ZodObject<z.ZodRawShape> | undefined;
  readonly defaultProps?: ScriptPropertyBag | undefined;
  readonly description?: string | undefined;
  readonly injectLuaChunks?: readonly string[] | undefined;
};

export function resolveLuaScriptProfileId(def: LuaScriptDefinition): string | undefined {
  return def.profileId;
}

export async function resolveLuaScriptSource(source: LuaScriptSource): Promise<string> {
  if (typeof source === 'string') {
    return source;
  }
  return source();
}
