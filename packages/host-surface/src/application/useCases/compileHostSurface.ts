import { buildLuaDefManifestFromHostSurfaceSpec } from '../../domain/hostSurfaceManifest.js';
import type {
  HostSurface,
  HostSurfaceCore,
  HostSurfaceSpec,
  HostSurfaceSpecForHost,
  HostWorkflowHooksSpec,
} from '../../domain/hostSurfaceTypes.js';
import type { SchemaValidationPort } from '../ports/SchemaValidationPort.js';
import { createBridgeDeclarationsFromHostSurfaceSpec } from './compileBridgeDeclarationsFromHostSurfaceSpec.js';

/**
 * Compiles a host surface using the injected schema validation port (tuple matches `UseCase` conventions in `@microverse/shared`).
 */
export function compileHostSurface<const TSpec extends HostSurfaceSpec>(
  ports: readonly [SchemaValidationPort],
  spec: TSpec,
): HostSurface<undefined>;
export function compileHostSurface<
  const TSpec extends HostSurfaceSpec,
  const THooks extends HostWorkflowHooksSpec,
>(ports: readonly [SchemaValidationPort], spec: TSpec, workflowHooks: THooks): HostSurface<THooks>;
export function compileHostSurface<const TSpec extends HostSurfaceSpec>(
  ports: readonly [SchemaValidationPort],
  spec: TSpec,
  workflowHooks?: HostWorkflowHooksSpec,
): HostSurface<undefined> | HostSurface<HostWorkflowHooksSpec> {
  const [schemaValidation] = ports;
  const core: HostSurfaceCore = {
    toBridgeDeclarations: () => createBridgeDeclarationsFromHostSurfaceSpec(schemaValidation, spec),
    toLuaDefManifest: (opts) => buildLuaDefManifestFromHostSurfaceSpec(spec, opts, workflowHooks),
  };
  if (workflowHooks === undefined) {
    return core;
  }
  return { ...core, workflowHooks };
}

/**
 * Same as {@link compileHostSurface}, but requires every bridge method to be typed with the same `THost`.
 */
export function compileHostSurfaceFor<
  THost,
  const THooks extends HostWorkflowHooksSpec | undefined = undefined,
>(
  ports: readonly [SchemaValidationPort],
  spec: HostSurfaceSpecForHost<THost>,
  workflowHooks?: THooks,
): THooks extends HostWorkflowHooksSpec ? HostSurface<THooks> : HostSurface<undefined> {
  return (
    workflowHooks === undefined
      ? compileHostSurface(ports, spec as unknown as HostSurfaceSpec)
      : compileHostSurface(ports, spec as unknown as HostSurfaceSpec, workflowHooks)
  ) as THooks extends HostWorkflowHooksSpec ? HostSurface<THooks> : HostSurface<undefined>;
}
