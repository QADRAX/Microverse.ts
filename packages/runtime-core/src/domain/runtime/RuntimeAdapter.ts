import type { Result } from '@luarizer/shared';

import type { SandboxId } from '../sandbox/SandboxId';
import type { SandboxScript } from '../sandbox/SandboxScript';
import type { ExecutionContext } from './ExecutionContext';
import type { ExecutionFailure } from './ExecutionFailure';
import type { RunScriptResult } from './RunScriptResult';

export type RuntimeAdapter = {
  readonly execute: (
    ctx: ExecutionContext,
    script: SandboxScript,
  ) => Promise<Result<RunScriptResult, ExecutionFailure>>;
  /** Tear down one logical slot in the shared VM (e.g. drop per-slot Lua environment). */
  readonly disposeSandbox?: (sandboxId: SandboxId) => Promise<void>;
};
