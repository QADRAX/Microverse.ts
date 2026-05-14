export { neverCancelledToken, type CancellationToken } from './domain/runtime/CancellationToken';
export type { ExecutionContext } from './domain/runtime/ExecutionContext';
export type { ExecutionFailure } from './domain/runtime/ExecutionFailure';
export type { RuntimeAdapter } from './domain/runtime/RuntimeAdapter';
export type { RunScriptInput } from './domain/runtime/RunScriptInput';
export type { RunScriptResult, SandboxScalar } from './domain/runtime/RunScriptResult';
export type {
  CreateSandboxOptions,
  Sandbox,
  SandboxRuntime,
} from './domain/runtime/SandboxRuntime';
export { createSandboxInstanceId, type SandboxInstanceId } from './domain/runtime/SandboxInstanceId';
export { fixedTimeout, noTimeout, type TimeoutPolicy } from './domain/runtime/TimeoutPolicy';
export { createSandboxId, type SandboxId } from './domain/sandbox/SandboxId';
/** Same branded string as {@link SandboxId}; use for multi-slot APIs in host code. */
export type { SandboxId as SlotKey } from './domain/sandbox/SandboxId';
export { createSandboxId as createSlotKey } from './domain/sandbox/SandboxId';
export { createSandboxScript, type SandboxScript } from './domain/sandbox/SandboxScript';
export { ConsoleLogger } from './infrastructure/logging/ConsoleLogger';
export { StubRuntimeAdapter } from './infrastructure/runtime/StubRuntimeAdapter';
export {
  createStubSandboxRuntime,
  StubSandboxRuntime,
  type StubSandboxRuntimeDeps,
} from './infrastructure/runtime/StubSandboxRuntime';
export { IsolatedSandboxRuntimeMap } from './infrastructure/composition/IsolatedSandboxRuntimeMap';
