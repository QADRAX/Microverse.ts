import { buildLuaDefManifestFromHostSurfaceSpec } from '../../domain/hostSurfaceManifest.js';
import {
  collectCapabilitiesFromHostSurfaceSpec,
  pickSurfaceCapabilities,
  type InferSurfaceCapabilities,
} from '../../domain/surfaceCapabilities.js';
import type {
  HostSurface,
  HostSurfaceCore,
  HostSurfaceSpec,
  HostWorkflowHooksSpec,
} from '../../domain/hostSurfaceTypes.js';
import type { SchemaValidationPort } from '../ports/SchemaValidationPort.js';
import { createBridgeDeclarationsFromHostSurfaceSpec } from './compileBridgeDeclarationsFromHostSurfaceSpec.js';

function buildHostSurfaceCore<const TSpec extends HostSurfaceSpec>(
  schemaValidation: SchemaValidationPort,
  spec: TSpec,
  workflowHooks?: HostWorkflowHooksSpec,
): HostSurfaceCore<InferSurfaceCapabilities<TSpec>> {
  const capabilities = collectCapabilitiesFromHostSurfaceSpec(spec);
  return {
    toBridgeDeclarations: () => createBridgeDeclarationsFromHostSurfaceSpec(schemaValidation, spec),
    toLuaDefManifest: (opts) => buildLuaDefManifestFromHostSurfaceSpec(spec, opts, workflowHooks),
    capabilities,
    pickCapabilities: (...picked) =>
      pickSurfaceCapabilities(capabilities, ...picked) as ReadonlyArray<
        Extract<(typeof picked)[number], InferSurfaceCapabilities<TSpec>>
      >,
  };
}

/**
 * Compiles a host surface using the injected schema validation port (tuple matches `UseCase` conventions in `@microverse.ts/shared`).
 */
export function compileHostSurface<const TSpec extends HostSurfaceSpec>(
  ports: readonly [SchemaValidationPort],
  spec: TSpec,
): HostSurface<undefined, InferSurfaceCapabilities<TSpec>>;
export function compileHostSurface<
  const TSpec extends HostSurfaceSpec,
  const THooks extends HostWorkflowHooksSpec,
>(
  ports: readonly [SchemaValidationPort],
  spec: TSpec,
  workflowHooks: THooks,
): HostSurface<THooks, InferSurfaceCapabilities<TSpec>>;
export function compileHostSurface<const TSpec extends HostSurfaceSpec>(
  ports: readonly [SchemaValidationPort],
  spec: TSpec,
  workflowHooks?: HostWorkflowHooksSpec,
): HostSurface<undefined, InferSurfaceCapabilities<TSpec>> | HostSurface<HostWorkflowHooksSpec, InferSurfaceCapabilities<TSpec>> {
  const [schemaValidation] = ports;
  const core = buildHostSurfaceCore(schemaValidation, spec, workflowHooks);
  if (workflowHooks === undefined) {
    return core;
  }
  return { ...core, workflowHooks };
}

/**
 * Same as {@link compileHostSurface}, but requires every bridge method to be typed with the same `THost`.
 */
export function compileHostSurfaceFor<
  const TSpec extends HostSurfaceSpec,
  const THooks extends HostWorkflowHooksSpec | undefined = undefined,
>(
  ports: readonly [SchemaValidationPort],
  spec: TSpec,
  workflowHooks?: THooks,
): THooks extends HostWorkflowHooksSpec
  ? HostSurface<THooks, InferSurfaceCapabilities<TSpec>>
  : HostSurface<undefined, InferSurfaceCapabilities<TSpec>> {
  return (
    workflowHooks === undefined
      ? compileHostSurface(ports, spec)
      : compileHostSurface(ports, spec, workflowHooks)
  ) as THooks extends HostWorkflowHooksSpec
    ? HostSurface<THooks, InferSurfaceCapabilities<TSpec>>
    : HostSurface<undefined, InferSurfaceCapabilities<TSpec>>;
}
