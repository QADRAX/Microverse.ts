import { buildLuaDefManifestFromHostSurfaceSpec } from '../../domain/hostSurfaceManifest';
import type { ComponentTypeDefRegistry } from '../../domain/componentTypeSpec';
import {
  buildResolvedScriptProfileRegistry,
  validateScriptProfileRegistry,
} from '../../domain/scriptProfileSpec';
import {
  collectCapabilitiesFromHostSurfaceSpec,
  pickSurfaceCapabilities,
  type InferSurfaceCapabilities,
} from '../../domain/surfaceCapabilities';
import type {
  HostSurface,
  HostSurfaceCore,
  HostSurfaceSpec,
  HostComponentHooksSpec,
} from '../../domain/hostSurfaceTypes';
import type { SchemaValidationPort } from '../ports/SchemaValidationPort';
import { createBridgeDeclarationsFromHostSurfaceSpec } from './compileBridgeDeclarationsFromHostSurfaceSpec';

function buildHostSurfaceCore<const TSpec extends HostSurfaceSpec>(
  schemaValidation: SchemaValidationPort,
  spec: TSpec,
  componentTypeRegistry: ComponentTypeDefRegistry,
  componentHooks?: HostComponentHooksSpec,
): HostSurfaceCore<InferSurfaceCapabilities<TSpec>> {
  validateScriptProfileRegistry(componentTypeRegistry, spec, componentHooks, {
    requireAtLeastOne: false,
  });
  const componentTypes = buildResolvedScriptProfileRegistry(componentTypeRegistry, spec);
  const capabilities = collectCapabilitiesFromHostSurfaceSpec(spec);

  return {
    getHostSurfaceSpec: () => spec,
    toBridgeDeclarations: () => createBridgeDeclarationsFromHostSurfaceSpec(schemaValidation, spec),
    toLuaDefManifest: (opts) =>
      buildLuaDefManifestFromHostSurfaceSpec(spec, opts, componentHooks, componentTypes),
    capabilities,
    componentTypes,
    getComponentType: (name: string) => {
      const profile = componentTypes[name];
      if (profile === undefined) {
        throw new Error(`unknown component type: ${name}`);
      }
      return profile;
    },
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
  componentTypeRegistry: ComponentTypeDefRegistry,
): HostSurface<undefined, InferSurfaceCapabilities<TSpec>>;
export function compileHostSurface<
  const TSpec extends HostSurfaceSpec,
  const THooks extends HostComponentHooksSpec,
>(
  ports: readonly [SchemaValidationPort],
  spec: TSpec,
  componentTypeRegistry: ComponentTypeDefRegistry,
  componentHooks: THooks,
): HostSurface<THooks, InferSurfaceCapabilities<TSpec>>;
export function compileHostSurface<const TSpec extends HostSurfaceSpec>(
  ports: readonly [SchemaValidationPort],
  spec: TSpec,
  componentTypeRegistry: ComponentTypeDefRegistry,
  componentHooks?: HostComponentHooksSpec,
): HostSurface<undefined, InferSurfaceCapabilities<TSpec>> | HostSurface<HostComponentHooksSpec, InferSurfaceCapabilities<TSpec>> {
  const [schemaValidation] = ports;
  const core = buildHostSurfaceCore(schemaValidation, spec, componentTypeRegistry, componentHooks);
  if (componentHooks === undefined) {
    return core;
  }
  return { ...core, componentHooks };
}

/**
 * Same as {@link compileHostSurface}, but requires every bridge method to be typed with the same `THost`.
 */
export function compileHostSurfaceFor<
  const TSpec extends HostSurfaceSpec,
  const THooks extends HostComponentHooksSpec | undefined = undefined,
>(
  ports: readonly [SchemaValidationPort],
  spec: TSpec,
  componentTypeRegistry: ComponentTypeDefRegistry,
  componentHooks?: THooks,
): THooks extends HostComponentHooksSpec
  ? HostSurface<THooks, InferSurfaceCapabilities<TSpec>>
  : HostSurface<undefined, InferSurfaceCapabilities<TSpec>> {
  return (
    componentHooks === undefined
      ? compileHostSurface(ports, spec, componentTypeRegistry)
      : compileHostSurface(ports, spec, componentTypeRegistry, componentHooks)
  ) as THooks extends HostComponentHooksSpec
    ? HostSurface<THooks, InferSurfaceCapabilities<TSpec>>
    : HostSurface<undefined, InferSurfaceCapabilities<TSpec>>;
}
