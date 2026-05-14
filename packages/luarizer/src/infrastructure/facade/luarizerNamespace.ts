import { createWasmSandboxRuntime } from '@luarizer/runtime-wasm';

/**
 * Namespaced helpers for hosts that prefer one import style.
 */
export const Luarizer = {
  /** One Wasmoon VM per runtime; use `SandboxRuntime.createSandbox` for each slot. */
  createWasmRuntime: createWasmSandboxRuntime,
} as const;
