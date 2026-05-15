import { compileHostSurface, compileHostSurfaceFor } from '../../application/useCases/compileHostSurface.js';
import type { SchemaValidationPort } from '../../application/ports/SchemaValidationPort.js';
import type { HostSurface, HostSurfaceSpec, HostWorkflowHooksSpec } from '../../domain/hostSurfaceTypes.js';

import { createZodSchemaValidationPort } from '../adapters/zodSchemaValidationAdapter.js';

const defaultPorts: readonly [SchemaValidationPort] = [createZodSchemaValidationPort()];

export { cap, fn } from '../../domain/hostSurfaceMethodHelpers.js';
export type { InferSurfaceCapabilities } from '../../domain/surfaceCapabilities.js';
import type { InferSurfaceCapabilities } from '../../domain/surfaceCapabilities.js';

export type {
  AnyHostSurfaceMethod,
  HostFnContext,
  HostSurface,
  HostSurfaceCore,
  HostSurfaceMethodEntry,
  HostSurfaceSpec,
  HostSurfaceSpecForHost,
  HostWorkflowHooksSpec,
  LuaDefManifestGeneratorOpts,
} from '../../domain/hostSurfaceTypes.js';

/**
 * Declares a **host surface**: nested bridge tables for Lua, each method gated by a capability and Zod schemas.
 *
 * @remarks
 * - Each top-level key becomes one bridge name injected via `mergeEnv` (e.g. `orders`, `time`).
 * - Lua calls look like `orders:get({ orderId = "x" })` (or `orders.get({ ... })`) — one payload table per method;
 *   bridges accept both forms (colon passes `self` as the first argument). Async handlers return handles; Lua uses `:await()` or a 2nd-arg `onComplete` callback (see `@microverse/runtime-wasm`).
 * - Pair with {@link HostScriptSession} or {@link buildBridgeMergeEnvForHost} and an allowlisted registry.
 * - Optional **workflow hooks** (second argument): Zod payloads per event kind — emitted into LuaCATS as abstract `Workflow` plus a per-slot `workflow:extend()` helper; the returned surface includes them as readonly `workflowHooks` on the surface object. Do not name a TS bridge table `workflow` when hooks are enabled (that name is reserved for the injected Lua helper).
 *
 * @example
 * ```ts
 * const surface = defineHostSurface({
 *   time: {
 *     delta: fn<MyHost, Record<string, never>, number>({
 *       capability: cap('engine:time'),
 *       input: z.object({}),
 *       output: z.number(),
 *       handler: ({ host }) => host.clock.dt,
 *     }),
 *   },
 * });
 * ```
 */
export function defineHostSurface<const TSpec extends HostSurfaceSpec>(
  spec: TSpec,
): HostSurface<undefined, InferSurfaceCapabilities<TSpec>>;
export function defineHostSurface<
  const TSpec extends HostSurfaceSpec,
  const THooks extends HostWorkflowHooksSpec,
>(
  spec: TSpec,
  workflowHooks: THooks,
): HostSurface<THooks, InferSurfaceCapabilities<TSpec>>;
export function defineHostSurface<const TSpec extends HostSurfaceSpec>(
  spec: TSpec,
  workflowHooks?: HostWorkflowHooksSpec,
): HostSurface<undefined, InferSurfaceCapabilities<TSpec>> | HostSurface<HostWorkflowHooksSpec, InferSurfaceCapabilities<TSpec>> {
  return workflowHooks === undefined
    ? compileHostSurface(defaultPorts, spec)
    : compileHostSurface(defaultPorts, spec, workflowHooks);
}

/**
 * Same as {@link defineHostSurface}, but requires every bridge method to be typed with the same `THost`
 * so `fn<THost, …>(…)` stays aligned with your engine context (the `THost` you pass as `host` into {@link HostScriptSession}).
 *
 * @typeParam THooks - Inferred from `workflowHooks` when you pass it; omit (or leave defaulted) for a surface without workflow hooks.
 *
 * @remarks
 * Avoid `defineHostSurfaceFor<YourHost>(spec, hooks)` with a **single** explicit type argument: TypeScript will
 * fix `THooks` to its default (`undefined`) and reject the second value. Omit type arguments (host is inferred from
 * each `fn<YourHost, …>`), or pass both: `defineHostSurfaceFor<YourHost, typeof hooks>(spec, hooks)`.
 */
export function defineHostSurfaceFor<
  const TSpec extends HostSurfaceSpec,
  const THooks extends HostWorkflowHooksSpec | undefined = undefined,
>(
  spec: TSpec,
  workflowHooks?: THooks,
): THooks extends HostWorkflowHooksSpec
  ? HostSurface<THooks, InferSurfaceCapabilities<TSpec>>
  : HostSurface<undefined, InferSurfaceCapabilities<TSpec>> {
  return compileHostSurfaceFor(defaultPorts, spec, workflowHooks);
}
