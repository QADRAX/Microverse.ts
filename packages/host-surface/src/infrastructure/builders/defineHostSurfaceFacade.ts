import type { SchemaValidationPort } from '../../application/ports/SchemaValidationPort.js';

import { createZodSchemaValidationPort } from '../adapters/zodSchemaValidationAdapter.js';
import { SurfaceBuilder } from './surfaceBuilder.js';

const defaultPorts: readonly [SchemaValidationPort] = [createZodSchemaValidationPort()];

export type { InferSurfaceCapabilities } from '../../domain/surfaceCapabilities.js';
export type { SurfaceMethodDef } from '../../domain/surfaceMethodDef.js';
export { BridgeBuilder, SurfaceBuilder } from './surfaceBuilder.js';

export type {
  AnyHostSurfaceMethod,
  HostFnContext,
  HostSurface,
  HostSurfaceCore,
  HostSurfaceMethodEntry,
  HostSurfaceSpec,
  HostSurfaceSpecForHost,
  HostComponentHooksSpec,
  LuaDefManifestGeneratorOpts,
} from '../../domain/hostSurfaceTypes.js';

function createSurfaceBuilder<THost>(): SurfaceBuilder<THost> {
  return new SurfaceBuilder<THost>(defaultPorts);
}

/**
 * Declares a **host surface** via the fluent builder (`bridge` → `method` → `build`).
 *
 * @example
 * ```ts
 * const surface = defineHostSurface()
 *   .bridge('time')
 *   .method('delta', {
 *     requires: 'engine:time',
 *     input: z.object({}),
 *     output: z.number(),
 *     handler: ({ host }) => host.clock.dt,
 *   })
 *   .build();
 * ```
 */
export function defineHostSurface(): SurfaceBuilder<unknown> {
  return createSurfaceBuilder();
}

/**
 * Same as {@link defineHostSurface}, but every `handler` is typed against a single `THost`
 * (the engine context passed to {@link HostScriptSession} / {@link MicroverseLua.create}).
 *
 * @example
 * ```ts
 * const surface = defineHostSurfaceFor<MyHost>()
 *   .bridge('greet')
 *   .method('hello', {
 *     requires: 'demo:greet',
 *     input: z.object({ name: z.string() }),
 *     output: z.string(),
 *     handler: ({ host }, { name }) => `Hello, ${name}`,
 *   })
 *   .build();
 * ```
 */
export function defineHostSurfaceFor<THost>(): SurfaceBuilder<THost> {
  return createSurfaceBuilder<THost>();
}
