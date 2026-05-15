/**
 * **@microverse/microverse-lua** — Lua microverse entry for consuming applications.
 *
 * Plug-and-play Lua scripting: **{@link MicroverseLua.create}** (built-in Wasm VM) and the fluent
 * **{@link defineHostSurfaceFor}** builder (`bridge` → `method` → `build`).
 */
export {
  augmentHostWithCapabilityRegistry,
  BridgeBuilder,
  buildBridgeMergeEnvForHost,
  collectCapabilitiesFromHostSurfaceSpec,
  compileHostSurface,
  compileHostSurfaceFor,
  createBridgeDeclarationsFromHostSurfaceSpec,
  defineHostSurface,
  defineHostSurfaceFor,
  HostScriptSession,
  luaGlobalHookName,
  luaType,
  MICROVERSE_CAPABILITY_REGISTRY,
  pickSurfaceCapabilities,
  SurfaceBuilder,
  zodToLuaTypeRef,
  type AnyHostSurfaceMethod,
  type HostFnContext,
  type HostScriptSessionOptions,
  type HostSurface,
  type HostSurfaceCore,
  type HostSurfaceMethodEntry,
  type HostSurfaceSpec,
  type HostSurfaceSpecForHost,
  type HostWorkflowHooksSpec,
  type InferSurfaceCapabilities,
  type LuaDefManifestGeneratorOpts,
  type LuaGlobalHookName,
  type SchemaValidationPort,
  type SurfaceCapabilityString,
  type SurfaceMethodDef,
  type WithMicroverseCapabilityRegistry,
  type WorkflowHookInvokeArgs,
  type ZodToLuaTypeRefOptions,
} from '@microverse/host-surface';
export * from '@microverse/shared';
export * from '@microverse/runtime-core';
export * from '@microverse/runtime-lua';
export * from '@microverse/runtime-wasm';
export * from '@microverse/runtime-bridge';
export * from '@microverse/runtime-capabilities';
export * from '@microverse/runtime-zod';

export { MicroverseLua } from './infrastructure/facade/microverseLuaNamespace.js';
export {
  createLuaMicroverse,
  LuaMicroverse,
  type LuaMicroverseConfig,
  type InferScriptHooksFromHost,
  type InferScriptHooksFromSurface,
  type InferSurfaceCapabilitiesFromSurface,
  type TaggedLuaMicroverseHost,
} from './infrastructure/facade/luaMicroverse.js';
