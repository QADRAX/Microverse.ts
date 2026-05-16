import type { ScriptProfileDefInput } from '@microverse.ts/runtime-core';
import type { z } from 'zod';

import type { HostComponentHooksSpec, HostSurfaceSpec } from './hostSurfaceTypes';
import {
  validateScriptProfileRegistry,
  type ScriptProfileDefRegistry,
} from './scriptProfileSpec';

/** Fluent input for {@link SurfaceBuilder.componentType} (requires `state`; catalog profiles may omit it). */
export type ComponentTypeDefInput<
  TCap extends `${string}:${string}` = `${string}:${string}`,
  THooks extends HostComponentHooksSpec | undefined = undefined,
> = ScriptProfileDefInput<TCap> & {
  readonly state: z.ZodObject<z.ZodRawShape>;
  readonly hooks?: THooks extends HostComponentHooksSpec
    ? readonly (keyof THooks & string)[]
    : readonly string[] | undefined;
};

export type ComponentTypeDefRegistry = ScriptProfileDefRegistry;

export function validateComponentTypeRegistry(
  registry: ComponentTypeDefRegistry,
  spec: HostSurfaceSpec,
  componentHooks?: HostComponentHooksSpec,
): void {
  validateScriptProfileRegistry(registry, spec, componentHooks, { requireAtLeastOne: false });
}
