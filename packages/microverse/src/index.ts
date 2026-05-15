/**
 * **@microverse/microverse** — single entry for consuming applications.
 *
 * Re-exports runtime, bridges, capabilities, Zod helpers, shared types, **{@link defineHostSurface}**,
 * and the {@link createLuaMicroverse} façade for multi-script Lua hosts.
 * from `@microverse/host-surface`. Prefer importing from this package so apps depend on one workspace / npm name.
 */
export * from '@microverse/host-surface';
export * from '@microverse/shared';
export * from '@microverse/runtime-core';
export * from '@microverse/runtime-lua';
export * from '@microverse/runtime-wasm';
export * from '@microverse/runtime-bridge';
export * from '@microverse/runtime-capabilities';
export * from '@microverse/runtime-zod';

export { Microverse } from './infrastructure/facade/microverseNamespace';
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
