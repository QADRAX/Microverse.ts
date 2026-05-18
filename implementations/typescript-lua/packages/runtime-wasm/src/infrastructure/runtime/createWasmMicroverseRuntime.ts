import {
  ConsoleLogger,
  createStubMicroverseRuntime,
  type MicroverseRuntime,
  type TimeoutPolicy,
} from '@microverse.ts/runtime-core';

import { WasmoonRuntimeAdapter, type WasmoonRuntimeAdapterOptions } from './WasmoonRuntimeAdapter';

export type WasmMicroverseRuntimeOptions = WasmoonRuntimeAdapterOptions & {
  /** Default timeout forwarded to each {@link MicroverseSlot.run} when the call omits `timeout`. */
  readonly defaultTimeout?: TimeoutPolicy | undefined;
};

/**
 * Wasmoon-backed {@link MicroverseRuntime} with hardened slot bootstrap (safe globals, instruction budget).
 */
export function createWasmMicroverseRuntime(options: WasmMicroverseRuntimeOptions = {}): MicroverseRuntime {
  const { defaultTimeout, ...adapterOptions } = options;
  return createStubMicroverseRuntime({
    adapter: new WasmoonRuntimeAdapter(adapterOptions),
    logger: new ConsoleLogger(),
    defaultTimeout,
  });
}
