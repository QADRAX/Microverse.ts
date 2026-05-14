import type { Result } from '@luarizer/shared';

import type { SandboxId } from '../sandbox/SandboxId';
import type { ExecutionFailure } from './ExecutionFailure';
import type { RunScriptInput } from './RunScriptInput';
import type { RunScriptResult } from './RunScriptResult';
import type { TimeoutPolicy } from './TimeoutPolicy';

export type CreateSandboxOptions = {
  readonly defaultTimeout?: TimeoutPolicy | undefined;
  /**
   * Stable slot key for this script inside the **same** {@link SandboxRuntime} / Wasmoon VM.
   * When omitted, a random id is generated (still shares the VM with other slots from this runtime).
   */
  readonly slotKey?: SandboxId | undefined;
};

export type Sandbox = {
  readonly id: SandboxId;
  readonly run: (input: RunScriptInput) => Promise<Result<RunScriptResult, ExecutionFailure>>;
  readonly dispose: () => Promise<void>;
};

/**
 * One runtime owns **one** Wasmoon/Lua VM (when using `@luarizer/runtime-wasm`).
 * Call {@link SandboxRuntime.createSandbox} multiple times to register **many slots** in that VM.
 */
export type SandboxRuntime = {
  readonly createSandbox: (options: CreateSandboxOptions) => Promise<Sandbox>;
};
