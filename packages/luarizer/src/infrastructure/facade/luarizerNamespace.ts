import { createWasmSandboxRuntime } from '@luarizer/runtime-wasm';

/**
 * Small **namespace** of factory helpers for hosts that prefer `Luarizer.*` instead of deep imports.
 *
 * @remarks
 * For declarative Lua APIs and IDE stubs, use {@link defineHostSurface}, {@link fn}, and {@link cap}
 * from this same package (re-exported from `@luarizer/host-surface`).
 */
export const Luarizer = {
  /**
   * Creates a {@link SandboxRuntime} backed by **one** Wasmoon Lua VM; call `createSandbox` per slot / script.
   */
  createWasmRuntime: createWasmSandboxRuntime,
} as const;
