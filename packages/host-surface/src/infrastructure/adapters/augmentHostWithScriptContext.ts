import type { ScriptInstanceContext } from '@microverse.ts/runtime-core';

import { MICROVERSE_SCRIPT_CONTEXT, type WithMicroverseScriptContext } from '../../domain/scriptContextSymbol.js';

export function augmentHostWithScriptContext<THost>(
  host: THost,
  script: ScriptInstanceContext,
): THost & WithMicroverseScriptContext {
  return Object.assign(host as object, {
    [MICROVERSE_SCRIPT_CONTEXT]: script,
  }) as THost & WithMicroverseScriptContext;
}
