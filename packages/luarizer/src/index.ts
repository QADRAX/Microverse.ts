/**
 * **@luarizer/luarizer** — single entry for consuming applications.
 *
 * Re-exports runtime, bridges, capabilities, Zod helpers, shared types, **{@link defineHostSurface}**,
 * and the {@link createHostWorkflowHub} façade for multi-workflow hosts.
 * from `@luarizer/host-surface`. Prefer importing from this package so apps depend on one workspace / npm name.
 */
export * from '@luarizer/host-surface';
export * from '@luarizer/shared';
export * from '@luarizer/runtime-core';
export * from '@luarizer/runtime-lua';
export * from '@luarizer/runtime-wasm';
export * from '@luarizer/runtime-bridge';
export * from '@luarizer/runtime-capabilities';
export * from '@luarizer/runtime-zod';

export { Luarizer } from './infrastructure/facade/luarizerNamespace';
export {
  createHostWorkflowHub,
  HostWorkflowHub,
  type HostWorkflowHubConfig,
  type InferWorkflowHooksFromSurface,
} from './infrastructure/facade/hostWorkflowHub.js';
