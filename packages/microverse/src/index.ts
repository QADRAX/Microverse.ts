/**
 * **@microverse/microverse** — single entry for consuming applications.
 *
 * Re-exports runtime, bridges, capabilities, Zod helpers, shared types, **{@link defineHostSurface}**,
 * and the {@link createHostWorkflowHub} façade for multi-workflow hosts.
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
  createHostWorkflowHub,
  HostWorkflowHub,
  type HostWorkflowHubConfig,
  type InferWorkflowHooksFromHost,
  type InferWorkflowHooksFromSurface,
  type TaggedWorkflowHost,
} from './infrastructure/facade/hostWorkflowHub.js';
