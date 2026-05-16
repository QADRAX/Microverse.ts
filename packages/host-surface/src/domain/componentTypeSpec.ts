import type { ScriptProfileDefInput } from '@microverse.ts/runtime-core';
import type { z } from 'zod';

import type { HostComponentHooksSpec, HostSurfaceSpec } from './hostSurfaceTypes';
import {
  buildResolvedScriptProfileRegistry,
  resolveScriptProfile,
  validateScriptProfileRegistry,
  type ResolvedScriptProfile,
  type ResolvedScriptProfileRegistry,
  type ScriptProfileDefRegistry,
  scriptProfileBridgesClassName,
  scriptProfileComponentClassName,
  scriptProfilePropsAlias,
  scriptProfileStateAlias,
  bridgeNamesForCapabilities,
  EMPTY_PROPS,
  EMPTY_STATE,
} from './scriptProfileSpec';

/** Fluent input for {@link SurfaceBuilder.componentType} (alias of {@link ScriptProfileDefInput} with required `state`). */
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

export type ResolvedComponentTypeProfile = ResolvedScriptProfile;

export type ResolvedComponentTypeRegistry = ResolvedScriptProfileRegistry;

export const componentTypeClassName = scriptProfileComponentClassName;
export const componentTypePropsAlias = scriptProfilePropsAlias;
export const componentTypeStateAlias = scriptProfileStateAlias;
export const componentTypeBridgesClassName = scriptProfileBridgesClassName;

export { bridgeNamesForCapabilities, EMPTY_PROPS, EMPTY_STATE };

export const resolveComponentTypeProfile = resolveScriptProfile;
export const buildResolvedComponentTypeRegistry = buildResolvedScriptProfileRegistry;

export function validateComponentTypeRegistry(
  registry: ComponentTypeDefRegistry,
  spec: HostSurfaceSpec,
  componentHooks?: HostComponentHooksSpec,
): void {
  validateScriptProfileRegistry(registry, spec, componentHooks, { requireAtLeastOne: false });
}
