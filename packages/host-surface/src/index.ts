/**
 * Declarative **host surface** for Lua sandboxes: Zod-validated bridge methods, capability checks,
 * `LuarizerDefManifest` generation for `.d.lua`, and {@link HostScriptSession} helpers.
 *
 * @packageDocumentation
 */
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
  type HostWorkflowHooksSpec,
  type LuarizerDefManifestGeneratorOpts,
} from './application/defineHostSurface.js';
export { HostScriptSession, type HostScriptSessionOptions } from './application/hostScriptSession.js';
export { luaGlobalHookName, type LuaGlobalHookName } from './application/luaGlobalHook.js';
export { zodToLuaTypeRef } from './application/zodToLuaTypeRef.js';
export {
  augmentHostWithCapabilityRegistry,
  LUARIZER_CAPABILITY_REGISTRY,
  type WithLuarizerCapabilityRegistry,
} from './domain/capabilityRegistrySymbol.js';
