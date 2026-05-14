import type { SandboxScript } from '../sandbox/SandboxScript';
import type { TimeoutPolicy } from './TimeoutPolicy';

export type RunScriptInput = {
  readonly script: SandboxScript;
  readonly timeout?: TimeoutPolicy | undefined;
  /**
   * Shallow-merged into this slot’s Lua environment **before** the chunk loads (Wasmoon path).
   * Keys remain on `_ENV` for later `run` calls on the same slot until `disposeSandbox` clears the slot.
   * Typical use: one top-level global per bridge name, e.g. `{ Data: { load: (id) => ... } }` from
   * `buildDeclarativeBridgeTable`. Other adapters may ignore this field.
   */
  readonly mergeEnv?: Readonly<Record<string, unknown>> | undefined;
};
