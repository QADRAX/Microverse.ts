import {
  ConsoleLogger,
  createStubSandboxRuntime,
  type SandboxRuntime,
  type TimeoutPolicy,
} from '@luarizer/runtime-core';

import { WasmoonRuntimeAdapter, type WasmoonRuntimeAdapterOptions } from './WasmoonRuntimeAdapter';

export type WasmSandboxRuntimeOptions = WasmoonRuntimeAdapterOptions & {
  /** Default timeout forwarded to each {@link Sandbox.run} when the call omits `timeout`. */
  readonly defaultTimeout?: TimeoutPolicy | undefined;
};

/**
 * Wasmoon-backed {@link SandboxRuntime} with hardened slot bootstrap (safe globals, instruction budget).
 */
export function createWasmSandboxRuntime(options: WasmSandboxRuntimeOptions = {}): SandboxRuntime {
  const { defaultTimeout, ...adapterOptions } = options;
  return createStubSandboxRuntime({
    adapter: new WasmoonRuntimeAdapter(adapterOptions),
    logger: new ConsoleLogger(),
    defaultTimeout,
  });
}
