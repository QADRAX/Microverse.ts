import type { Result } from '@microverse.ts/shared';

import type { MicroverseId } from '../microverse/MicroverseId';
import type { ExecutionContext } from './ExecutionContext';
import type { ExecutionFailure } from './ExecutionFailure';
import type { RunScriptInput } from './RunScriptInput';
import type { RunScriptResult } from './RunScriptResult';

export type RuntimeAdapter = {
  readonly execute: (
    ctx: ExecutionContext,
    input: RunScriptInput,
  ) => Promise<Result<RunScriptResult, ExecutionFailure>>;
  /** Tear down one logical slot in the shared VM (e.g. drop per-slot Lua environment). */
  readonly disposeMicroverse?: (microverseId: MicroverseId) => Promise<void>;
};
