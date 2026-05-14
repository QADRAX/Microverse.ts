import type { Result } from '@luarizer/shared';

import type { SandboxId } from '../sandbox/SandboxId';
import type { ExecutionFailure } from './ExecutionFailure';
import type { RunScriptInput } from './RunScriptInput';
import type { RunScriptResult } from './RunScriptResult';
import type { TimeoutPolicy } from './TimeoutPolicy';

export type CreateSandboxOptions = {
  readonly defaultTimeout?: TimeoutPolicy | undefined;
};

export type Sandbox = {
  readonly id: SandboxId;
  readonly run: (input: RunScriptInput) => Promise<Result<RunScriptResult, ExecutionFailure>>;
  readonly dispose: () => Promise<void>;
};

export type SandboxRuntime = {
  readonly createSandbox: (options: CreateSandboxOptions) => Promise<Sandbox>;
};
