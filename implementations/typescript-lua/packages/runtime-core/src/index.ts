export { neverCancelledToken, type CancellationToken } from './domain/runtime/CancellationToken';
export type { ExecutionContext } from './domain/runtime/ExecutionContext';
export {
  formatExecutionFailure,
  type ExecutionFailure,
} from './domain/runtime/ExecutionFailure';
export type { RuntimeAdapter } from './domain/runtime/RuntimeAdapter';
export type { RunScriptInput } from './domain/runtime/RunScriptInput';
export type { RunScriptResult, MicroverseScalar } from './domain/runtime/RunScriptResult';
export type {
  CreateMicroverseOptions,
  MicroverseSlot,
  MicroverseRuntime,
} from './domain/runtime/MicroverseRuntime';
export { createMicroverseInstanceId, type MicroverseInstanceId } from './domain/runtime/MicroverseInstanceId';
export { fixedTimeout, noTimeout, type TimeoutPolicy } from './domain/runtime/TimeoutPolicy';
export { createLuaEnvSlotKey, createMicroverseId, type MicroverseId } from './domain/microverse/MicroverseId';
/** Same branded string as {@link MicroverseId}; use for multi-slot APIs in host code. */
export type { MicroverseId as SlotKey } from './domain/microverse/MicroverseId';
export { createMicroverseId as createSlotKey } from './domain/microverse/MicroverseId';
export { createMicroverseScript, type MicroverseScript } from './domain/microverse/MicroverseScript';
export { ConsoleLogger } from './infrastructure/logging/ConsoleLogger';
export { StubRuntimeAdapter } from './infrastructure/runtime/StubRuntimeAdapter';
export {
  createStubMicroverseRuntime,
  StubMicroverseRuntime,
  type StubMicroverseRuntimeDeps,
} from './infrastructure/runtime/StubMicroverseRuntime';
export { IsolatedMicroverseRuntimeMap } from './infrastructure/composition/IsolatedMicroverseRuntimeMap';
export type {
  ScriptPropertyScalar,
  ScriptPropertyValue,
  ScriptPropertyBag,
  MutableScriptPropertyBag,
} from './domain/scriptProps/ScriptPropertyValue';
export {
  assertValidScriptPropertyBag,
  assertValidScriptPropertyValue,
  cloneScriptPropertyBag,
  cloneScriptPropertyValue,
  DEFAULT_SCRIPT_PROPERTY_LIMITS,
  type ScriptPropertyLimits,
} from './domain/scriptProps/scriptPropertyLimits';
export {
  applyScriptPropertyChanges,
  diffScriptProperties,
  mergeScriptPropertyBags,
  shallowEqualScriptPropertyValue,
} from './domain/scriptProps/scriptProperties';
export type { ScriptReferenceFieldDef, ScriptReferenceFieldSchema, ScriptReferenceKind } from './domain/script/scriptReferenceSchema';
export type { ScriptProfileDefInput } from './domain/script/scriptProfileDef';
export type { LuaScriptDefinition, LuaScriptSource } from './domain/script/LuaScriptDefinition';
export { resolveLuaScriptProfileId, resolveLuaScriptSource } from './domain/script/LuaScriptDefinition';
export type {
  ScriptInstanceContext,
  ScriptInstanceId,
  ScriptAuditTags,
} from './domain/script/ScriptInstanceContext';
export { createScriptInstanceContext, createScriptInstanceId } from './domain/script/ScriptInstanceContext';
export type { ScriptAuditEvent } from './domain/script/ScriptAuditEvent';
