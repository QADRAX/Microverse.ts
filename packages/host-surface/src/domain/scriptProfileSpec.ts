import { createCapabilityId, type CapabilityId } from '@microverse.ts/runtime-capabilities';
import type { ScriptProfileDefInput } from '@microverse.ts/runtime-core';
import { z } from 'zod';

import type { HostComponentHooksSpec, HostSurfaceSpec } from './hostSurfaceSpecTypes';
import { assertSafeObjectKey } from './safeObjectKey';
import { collectCapabilitiesFromHostSurfaceSpec } from './surfaceCapabilities';

export type ScriptProfileDefRegistry = Readonly<Record<string, ScriptProfileDefInput>>;

export type ResolvedScriptProfile = {
  readonly name: string;
  readonly extends?: string | undefined;
  readonly capabilities: readonly CapabilityId[];
  readonly props: z.ZodObject<z.ZodRawShape>;
  readonly state: z.ZodObject<z.ZodRawShape>;
  readonly hooks: readonly string[];
  readonly bridgeNames: readonly string[];
  readonly references?: ScriptProfileDefInput['references'];
};

export type ResolvedScriptProfileRegistry = Readonly<Record<string, ResolvedScriptProfile>>;

const EMPTY_PROPS = z.object({}) as z.ZodObject<z.ZodRawShape>;
const EMPTY_STATE = z.object({}) as z.ZodObject<z.ZodRawShape>;

export function scriptProfileComponentClassName(profileName: string): string {
  return `${profileName}Component`;
}

export function scriptProfilePropsAlias(profileName: string): string {
  return `${profileName}Props`;
}

export function scriptProfileStateAlias(profileName: string): string {
  return `${profileName}State`;
}

export function scriptProfileBridgesClassName(profileName: string): string {
  return `${profileName}Bridges`;
}

/** Bridge table names whose methods include at least one capability from the profile. */
export function bridgeNamesForCapabilities(
  spec: HostSurfaceSpec,
  capabilities: readonly CapabilityId[],
): readonly string[] {
  const allowed = new Set(capabilities.map((c) => String(c)));
  const names: string[] = [];
  for (const bridgeName of Object.keys(spec)) {
    const methods = spec[bridgeName]!;
    for (const methodName of Object.keys(methods)) {
      const entry = methods[methodName]!;
      if (allowed.has(String(entry.capability))) {
        names.push(bridgeName);
        break;
      }
    }
  }
  return names.sort((a, b) => a.localeCompare(b));
}

export function resolveScriptProfile(
  registry: ScriptProfileDefRegistry,
  name: string,
  spec: HostSurfaceSpec,
): ResolvedScriptProfile {
  const def = registry[name];
  if (def === undefined) {
    throw new Error(`unknown script profile: ${name}`);
  }

  const capabilities: CapabilityId[] = def.capabilities.map((c) => createCapabilityId(c));
  let props = def.props;
  let state = def.state ?? EMPTY_STATE;
  const hooks: string[] = [...(def.hooks ?? [])];
  let parentName = def.extends;

  const visited = new Set<string>([name]);
  while (parentName !== undefined) {
    if (visited.has(parentName)) {
      throw new Error(`script profile inheritance cycle: ${name}`);
    }
    visited.add(parentName);
    const parent = registry[parentName];
    if (parent === undefined) {
      throw new Error(`script profile "${name}" extends unknown profile "${parentName}"`);
    }
    const parentCaps = parent.capabilities.map((c) => createCapabilityId(c));
    for (const cap of parentCaps) {
      if (!capabilities.some((c) => String(c) === String(cap))) {
        capabilities.push(cap);
      }
    }
    props = parent.props.merge(props) as z.ZodObject<z.ZodRawShape>;
    const parentState = parent.state ?? EMPTY_STATE;
    state = parentState.merge(state) as z.ZodObject<z.ZodRawShape>;
    const parentHooks = parent.hooks ?? [];
    for (const h of parentHooks) {
      if (!hooks.includes(h)) {
        hooks.push(h);
      }
    }
    parentName = parent.extends;
  }

  hooks.sort((a, b) => a.localeCompare(b));
  const bridgeNames = bridgeNamesForCapabilities(spec, capabilities);

  return {
    name,
    extends: def.extends,
    capabilities,
    props,
    state,
    hooks,
    bridgeNames,
    references: def.references,
  };
}

export function buildResolvedScriptProfileRegistry(
  registry: ScriptProfileDefRegistry,
  spec: HostSurfaceSpec,
): ResolvedScriptProfileRegistry {
  const out: Record<string, ResolvedScriptProfile> = {};
  for (const name of Object.keys(registry)) {
    out[name] = resolveScriptProfile(registry, name, spec);
  }
  return out;
}

export function validateScriptProfileRegistry(
  registry: ScriptProfileDefRegistry,
  spec: HostSurfaceSpec,
  componentHooks?: HostComponentHooksSpec,
  opts?: { readonly requireAtLeastOne?: boolean | undefined },
): void {
  const requireAtLeastOne = opts?.requireAtLeastOne ?? false;
  if (requireAtLeastOne && Object.keys(registry).length === 0) {
    throw new Error('host surface: at least one script profile or .componentType() is required');
  }

  const surfaceCaps = new Set(
    collectCapabilitiesFromHostSurfaceSpec(spec).map((c) => String(c)),
  );
  const hookKinds =
    componentHooks !== undefined ? new Set(Object.keys(componentHooks)) : new Set<string>();

  for (const name of Object.keys(registry)) {
    assertSafeObjectKey('componentType', name);
    const def = registry[name]!;

    if (def.extends !== undefined) {
      assertSafeObjectKey('componentType', def.extends);
    }

    for (const cap of def.capabilities) {
      const id = createCapabilityId(cap);
      if (!surfaceCaps.has(String(id))) {
        throw new Error(
          `script profile "${name}": capability not declared on surface: ${String(cap)}`,
        );
      }
    }

    for (const hook of def.hooks ?? []) {
      if (!hookKinds.has(hook)) {
        throw new Error(
          `script profile "${name}": hook "${hook}" not declared in .componentHooks()`,
        );
      }
    }

    if (def.extends !== undefined && registry[def.extends] === undefined) {
      throw new Error(`script profile "${name}" extends unknown profile "${def.extends}"`);
    }
  }

  for (const name of Object.keys(registry)) {
    resolveScriptProfile(registry, name, spec);
  }
}

export { EMPTY_PROPS, EMPTY_STATE };
