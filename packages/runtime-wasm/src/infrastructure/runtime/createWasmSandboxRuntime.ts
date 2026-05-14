import {
  ConsoleLogger,
  createStubSandboxRuntime,
  type SandboxRuntime,
} from '@luarizer/runtime-core';

import { WasmoonRuntimeAdapter } from './WasmoonRuntimeAdapter';

export function createWasmSandboxRuntime(): SandboxRuntime {
  return createStubSandboxRuntime({
    adapter: new WasmoonRuntimeAdapter(),
    logger: new ConsoleLogger(),
  });
}
