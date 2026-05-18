import {
  assembleSurfaceSpecDocument,
  MICROVERSE_SCRIPT_PROFILE_LUA_1,
  type BuildSurfaceSpecDocumentOptions,
  type SurfaceSpecBridgeInput,
  type SurfaceSpecComponentType,
  type SurfaceSpecDocument,
} from '@microverse.ts/surface-spec';
import type { CapabilityId } from '@microverse.ts/runtime-capabilities';
import type { z } from 'zod';

import type { HostComponentHooksSpec, HostSurfaceSpec } from '../domain/hostSurfaceSpecTypes';
import type { ResolvedScriptProfileRegistry } from '../domain/scriptProfileSpec';
import { zodToJsonSchemaValue } from './zodToJsonSchemaValue';

function buildBridgesInput(spec: HostSurfaceSpec): Readonly<Record<string, SurfaceSpecBridgeInput>> {
  const bridges: Record<string, SurfaceSpecBridgeInput> = Object.create(null) as Record<
    string,
    SurfaceSpecBridgeInput
  >;
  for (const bridgeName of Object.keys(spec).sort((a, b) => a.localeCompare(b))) {
    const methodsRecord = spec[bridgeName]!;
    const methods: SurfaceSpecBridgeInput['methods'] = Object.create(null) as SurfaceSpecBridgeInput['methods'];
    for (const methodName of Object.keys(methodsRecord).sort((a, b) => a.localeCompare(b))) {
      const entry = methodsRecord[methodName]!;
      methods[methodName] = {
        requires: String(entry.capability),
        input: zodToJsonSchemaValue(entry.input),
        output: zodToJsonSchemaValue(entry.output),
        ...(entry.async === true ? { async: true } : {}),
        ...(entry.description !== undefined ? { description: entry.description } : {}),
      };
    }
    bridges[bridgeName] = { methods };
  }
  return bridges;
}

function buildComponentTypesInput(
  componentTypes: ResolvedScriptProfileRegistry,
): Readonly<Record<string, SurfaceSpecComponentType>> {
  const out: Record<string, SurfaceSpecComponentType> = Object.create(null) as Record<
    string,
    SurfaceSpecComponentType
  >;
  for (const name of Object.keys(componentTypes).sort((a, b) => a.localeCompare(b))) {
    const profile = componentTypes[name]!;
    out[name] = {
      capabilities: profile.capabilities.map((c: CapabilityId) => String(c)),
      hooks: [...profile.hooks],
      bridgeNames: [...profile.bridgeNames],
      props: zodToJsonSchemaValue(profile.props),
      state: zodToJsonSchemaValue(profile.state),
      ...(profile.extends !== undefined ? { extends: profile.extends } : {}),
    };
  }
  return out;
}

function buildComponentHooksInput(
  componentHooks: HostComponentHooksSpec | undefined,
): Readonly<Record<string, unknown>> | undefined {
  if (componentHooks === undefined) {
    return undefined;
  }
  const out: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const kind of Object.keys(componentHooks).sort((a, b) => a.localeCompare(b))) {
    const schema = componentHooks[kind];
    if (schema !== undefined) {
      out[kind] = zodToJsonSchemaValue(schema);
    }
  }
  return out;
}

/** Builds a {@link SurfaceSpecDocument} from a compiled Zod host surface (no handlers in JSON). */
export function buildSurfaceSpecDocumentFromZod(
  spec: HostSurfaceSpec,
  componentTypes: ResolvedScriptProfileRegistry,
  componentHooks: HostComponentHooksSpec | undefined,
  options?: BuildSurfaceSpecDocumentOptions,
): SurfaceSpecDocument {
  return assembleSurfaceSpecDocument({
    bridges: buildBridgesInput(spec),
    componentTypes: buildComponentTypesInput(componentTypes),
    componentHooks: buildComponentHooksInput(componentHooks),
    options: {
      scriptProfile: options?.scriptProfile ?? MICROVERSE_SCRIPT_PROFILE_LUA_1,
      ...options,
    },
  });
}
