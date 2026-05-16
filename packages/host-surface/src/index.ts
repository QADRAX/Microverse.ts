/**
 * Declarative **host surface** for Lua sandboxes: Zod-validated bridge methods, capability checks,
 * `LuaDefManifest` generation for `.d.lua`, and {@link HostScriptSession} helpers.
 *
 * @packageDocumentation
 */
export {
  buildBridgeMergeEnvForHost,
} from './infrastructure/builders/bridgeMergeEnv.js';
export {
  BridgeBuilder,
  defineHostSurface,
  defineHostSurfaceFor,
  SurfaceBuilder,
  type AnyHostSurfaceMethod,
  type HostFnContext,
  type HostSurface,
  type HostSurfaceCore,
  type HostSurfaceMethodEntry,
  type HostSurfaceSpec,
  type HostSurfaceSpecForHost,
  type HostWorkflowHooksSpec,
  type LuaDefManifestGeneratorOpts,
  type SurfaceMethodDef,
} from './infrastructure/builders/defineHostSurfaceFacade.js';
export {
  compileHostSurface,
  compileHostSurfaceFor,
} from './application/useCases/compileHostSurface.js';
export { createBridgeDeclarationsFromHostSurfaceSpec } from './application/useCases/compileBridgeDeclarationsFromHostSurfaceSpec.js';
export type { SchemaValidationPort } from './application/ports/SchemaValidationPort.js';
export {
  HostScriptSession,
  type HostScriptSessionOptions,
  type WorkflowHookInvokeArgs,
} from './infrastructure/components/hostScriptSession.js';
export { luaGlobalHookName, type LuaGlobalHookName } from './domain/luaGlobalHook.js';
export { luaType } from './domain/zodLuaType.js';
export { zodToLuaTypeRef, type ZodToLuaTypeRefOptions } from './domain/zodToLuaTypeRef.js';
export { MICROVERSE_CAPABILITY_REGISTRY, type WithMicroverseCapabilityRegistry } from './domain/capabilityRegistrySymbol.js';
export { augmentHostWithCapabilityRegistry } from './infrastructure/adapters/augmentHostWithCapabilityRegistry.js';
export type { InferSurfaceCapabilities } from './domain/surfaceCapabilities.js';
export type { SurfaceCapabilityString } from './domain/surfaceCapabilityString.js';
export { collectCapabilitiesFromHostSurfaceSpec, pickSurfaceCapabilities } from './domain/surfaceCapabilities.js';
