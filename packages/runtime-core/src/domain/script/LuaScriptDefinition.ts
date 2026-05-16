import type { z } from 'zod';

import type { ScriptPropertyBag } from '../scriptProps/ScriptPropertyValue.js';

export type LuaScriptSource = string | (() => string | Promise<string>);

/** Catalog entry: what a script is, not where it runs. */
export type LuaScriptDefinition = {
  readonly scriptId: string;
  readonly source: LuaScriptSource;
  readonly propsSchema?: z.ZodObject<z.ZodRawShape> | undefined;
  readonly defaultProps?: ScriptPropertyBag | undefined;
  readonly description?: string | undefined;
  readonly injectLuaChunks?: readonly string[] | undefined;
};

export async function resolveLuaScriptSource(source: LuaScriptSource): Promise<string> {
  if (typeof source === 'string') {
    return source;
  }
  return source();
}
