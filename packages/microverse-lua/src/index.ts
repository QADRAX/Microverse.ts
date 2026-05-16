/**
 * **@microverse.ts/microverse-lua** — Lua microverse entry for consuming applications.
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
  type HostComponentHooksSpec,
  type InferSurfaceCapabilities,
  type LuaDefManifestGeneratorOpts,
  type LuaGlobalHookName,
  type SchemaValidationPort,
  type SurfaceCapabilityString,
  type SurfaceMethodDef,
  type WithMicroverseCapabilityRegistry,
  type ComponentEventHookInvokeArgs,
  type ZodToLuaTypeRefOptions,
} from '@microverse.ts/host-surface';
export * from '@microverse.ts/shared';
export * from '@microverse.ts/runtime-core';
export * from '@microverse.ts/runtime-lua';
export * from '@microverse.ts/runtime-wasm';
export * from '@microverse.ts/runtime-bridge';
export * from '@microverse.ts/runtime-capabilities';
export * from '@microverse.ts/runtime-zod';

export { MicroverseLua } from './infrastructure/facade/microverseLuaNamespace';
export {
  createLuaMicroverse,
  LuaMicroverse,
  type LuaMicroverseConfig,
  type InferScriptHooksFromHost,
  type InferScriptHooksFromSurface,
  type InferSurfaceCapabilitiesFromSurface,
  type TaggedLuaMicroverseHost,
} from './infrastructure/facade/luaMicroverse';
