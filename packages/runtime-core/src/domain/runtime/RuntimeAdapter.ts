import type { Result } from '@luarizer/shared';

import type { SandboxScript } from '../sandbox/SandboxScript';
import type { ExecutionContext } from './ExecutionContext';
import type { ExecutionFailure } from './ExecutionFailure';
import type { RunScriptResult } from './RunScriptResult';

export type RuntimeAdapter = {
  readonly execute: (
    ctx: ExecutionContext,
    script: SandboxScript,
  ) => Promise<Result<RunScriptResult, ExecutionFailure>>;
};
