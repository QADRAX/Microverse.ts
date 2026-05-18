import type { Result } from '@microverse.ts/shared';

import type { MicroverseId } from '../microverse/MicroverseId';
import type { ExecutionFailure } from './ExecutionFailure';
import type { RunScriptInput } from './RunScriptInput';
import type { RunScriptResult } from './RunScriptResult';
import type { TimeoutPolicy } from './TimeoutPolicy';

export type CreateMicroverseOptions = {
  readonly defaultTimeout?: TimeoutPolicy | undefined;
  /**
   * Stable **Lua environment slot** id inside the shared {@link MicroverseRuntime} / Wasmoon VM (one `_ENV` per id).
   * Build with {@link createLuaEnvSlotKey} or {@link createMicroverseId}. When omitted, a random id is generated.
   */
  readonly slotKey?: MicroverseId | undefined;
};

export type MicroverseSlot = {
  readonly id: MicroverseId;
  readonly run: (input: RunScriptInput) => Promise<Result<RunScriptResult, ExecutionFailure>>;
  readonly dispose: () => Promise<void>;
};

/**
 * One runtime owns **one** Wasmoon/Lua VM (when using `@microverse.ts/runtime-wasm`).
 * Call {@link MicroverseRuntime.createMicroverse} multiple times to register **many slots** in that VM.
 */
export type MicroverseRuntime = {
  readonly createMicroverse: (options: CreateMicroverseOptions) => Promise<MicroverseSlot>;
};
