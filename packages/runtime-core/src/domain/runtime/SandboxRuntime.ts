import type { Result } from '@luarizer/shared';

import type { SandboxId } from '../sandbox/SandboxId';
import type { ExecutionFailure } from './ExecutionFailure';
import type { RunScriptInput } from './RunScriptInput';
import type { RunScriptResult } from './RunScriptResult';
import type { TimeoutPolicy } from './TimeoutPolicy';

export type CreateSandboxOptions = {
  readonly defaultTimeout?: TimeoutPolicy | undefined;
  /**
   * Stable **Lua environment slot** id inside the shared {@link SandboxRuntime} / Wasmoon VM (one `_ENV` per id).
   * Build with {@link createLuaEnvSlotKey} or {@link createSandboxId}. When omitted, a random id is generated.
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
