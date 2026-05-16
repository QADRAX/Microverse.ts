/**
 * Declarative **host surface** for Lua sandboxes: Zod-validated bridge methods, capability checks,
 * `LuaDefManifest` generation for `.d.lua`, and {@link HostScriptSession} helpers.
 *
 * @packageDocumentation
 */
export {
  buildBridgeMergeEnvForHost,
} from './infrastructure/builders/bridgeMergeEnv';
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
  type HostComponentHooksSpec,
  type LuaDefManifestGeneratorOpts,
  type SurfaceMethodDef,
} from './infrastructure/builders/defineHostSurfaceFacade';
export {
  compileHostSurface,
  compileHostSurfaceFor,
} from './application/useCases/compileHostSurface';
export { createBridgeDeclarationsFromHostSurfaceSpec } from './application/useCases/compileBridgeDeclarationsFromHostSurfaceSpec';
export type { SchemaValidationPort } from './application/ports/SchemaValidationPort';
export {
  HostScriptSession,
  type HostScriptSessionOptions,
  type ComponentEventHookInvokeArgs,
} from './infrastructure/components/hostScriptSession';
export { luaGlobalHookName, type LuaGlobalHookName } from './domain/luaGlobalHook';
export { luaType } from './domain/zodLuaType';
export { zodToLuaTypeRef, type ZodToLuaTypeRefOptions } from './domain/zodToLuaTypeRef';
export { MICROVERSE_CAPABILITY_REGISTRY, type WithMicroverseCapabilityRegistry } from './domain/capabilityRegistrySymbol';
export { augmentHostWithCapabilityRegistry } from './infrastructure/adapters/augmentHostWithCapabilityRegistry';
export { augmentHostWithScriptContext } from './infrastructure/adapters/augmentHostWithScriptContext';
export { MICROVERSE_LUA_COMPONENT_SLOT_PRELUDE } from './domain/componentSlotPrelude';
export {
  mergeEnvSinkToScriptPropertyBag,
  scriptPropertyBagToMergeEnv,
  scriptPropertyValueToPlain,
} from './domain/scriptPropertyMergeEnv';
export { MICROVERSE_SCRIPT_CONTEXT, type WithMicroverseScriptContext } from './domain/scriptContextSymbol';
export type { InferSurfaceCapabilities } from './domain/surfaceCapabilities';
export type { SurfaceCapabilityString } from './domain/surfaceCapabilityString';
export { collectCapabilitiesFromHostSurfaceSpec, pickSurfaceCapabilities } from './domain/surfaceCapabilities';
