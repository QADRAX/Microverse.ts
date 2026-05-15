/**
 * **@microverse/microverse-lua** — Lua microverse entry for consuming applications.
 *
 * Plug-and-play Lua scripting: **{@link MicroverseLua.create}** (built-in Wasm VM), plus **{@link defineHostSurface}**,
 * {@link fn}, and {@link cap} from `@microverse/host-surface`. Prefer this package over wiring runtimes yourself.
 */
export * from '@microverse/host-surface';
export * from '@microverse/shared';
export * from '@microverse/runtime-core';
export * from '@microverse/runtime-lua';
export * from '@microverse/runtime-wasm';
export * from '@microverse/runtime-bridge';
export * from '@microverse/runtime-capabilities';
export * from '@microverse/runtime-zod';

export { MicroverseLua } from './infrastructure/facade/microverseLuaNamespace.js';
/** @deprecated Use {@link MicroverseLua}. */
export { Microverse } from './infrastructure/facade/microverseNamespace.js';
export {
  createLuaMicroverse,
  LuaMicroverse,
  type LuaMicroverseConfig,
  type InferScriptHooksFromHost,
  type InferScriptHooksFromSurface,
  type InferSurfaceCapabilitiesFromSurface,
  type TaggedLuaMicroverseHost,
  /** @deprecated Use {@link createLuaMicroverse}. */
  createHostWorkflowHub,
  /** @deprecated Use {@link LuaMicroverse}. */
  type HostWorkflowHub,
  /** @deprecated Use {@link LuaMicroverseConfig}. */
  type HostWorkflowHubConfig,
  /** @deprecated Use {@link InferScriptHooksFromHost}. */
  type InferWorkflowHooksFromHost,
  /** @deprecated Use {@link InferScriptHooksFromSurface}. */
  type InferWorkflowHooksFromSurface,
  /** @deprecated Use {@link TaggedLuaMicroverseHost}. */
  type TaggedWorkflowHost,
} from './infrastructure/facade/luaMicroverse.js';
