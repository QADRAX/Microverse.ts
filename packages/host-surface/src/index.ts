export {
  buildBridgeMergeEnvForHost,
  cap,
  defineHostSurface,
  fn,
  type AnyHostSurfaceMethod,
  type HostFnContext,
  type HostSurface,
  type HostSurfaceMethodEntry,
  type HostSurfaceSpec,
} from './application/defineHostSurface.js';
export { HostScriptSession, type HostScriptSessionOptions } from './application/hostScriptSession.js';
export { zodToLuaTypeRef } from './application/zodToLuaTypeRef.js';
export {
  augmentHostWithCapabilityRegistry,
  LUARIZER_CAPABILITY_REGISTRY,
  type WithLuarizerCapabilityRegistry,
} from './domain/capabilityRegistrySymbol.js';
