import type { ScriptInstanceContext } from '@microverse.ts/runtime-core';

export const MICROVERSE_SCRIPT_CONTEXT = Symbol('microverse.scriptContext');

export type WithMicroverseScriptContext = {
  readonly [MICROVERSE_SCRIPT_CONTEXT]?: ScriptInstanceContext | undefined;
};
