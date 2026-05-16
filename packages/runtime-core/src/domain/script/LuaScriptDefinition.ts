import type { z } from 'zod';

import type { ScriptPropertyBag } from '../scriptProps/ScriptPropertyValue';
import type { ScriptProfileDefInput } from './scriptProfileDef';

export type LuaScriptSource = string | (() => string | Promise<string>);

/** Catalog entry: what a script is, not where it runs. */
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
  /** @deprecated Use `profileId`. */
  readonly componentType?: string | undefined;
  readonly propsSchema?: z.ZodObject<z.ZodRawShape> | undefined;
  readonly defaultProps?: ScriptPropertyBag | undefined;
  readonly description?: string | undefined;
  readonly injectLuaChunks?: readonly string[] | undefined;
};

export function resolveLuaScriptProfileId(def: LuaScriptDefinition): string | undefined {
  return def.profileId ?? def.componentType;
}

export async function resolveLuaScriptSource(source: LuaScriptSource): Promise<string> {
  if (typeof source === 'string') {
    return source;
  }
  return source();
}
