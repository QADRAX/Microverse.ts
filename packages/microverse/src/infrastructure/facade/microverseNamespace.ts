import { createWasmMicroverseRuntime } from '@microverse/runtime-wasm';

import { createLuaMicroverse } from './luaMicroverse.js';

/**
 * Small **namespace** of factory helpers for hosts that prefer `Microverse.*` instead of deep imports.
 *
 * @remarks
 * For declarative Lua APIs and IDE stubs, use {@link defineHostSurface}, {@link fn}, and {@link cap}
 * from this same package (re-exported from `@microverse/host-surface`).
 */
export const Microverse = {
  /**
   * Creates a {@link MicroverseRuntime} backed by **one** Wasmoon Lua VM; call `createMicroverse` per slot / script.
   */
  createWasmRuntime: createWasmMicroverseRuntime,
  /**
   * One shared Lua/Wasm VM with typed script sessions — see {@link createLuaMicroverse}.
   */
  createLuaMicroverse,
} as const;
