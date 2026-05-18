import type { Lua1TypeOverlay } from '@microverse.ts/lua-defs';
import type { z } from 'zod';

import type { HostComponentHooksSpec, HostSurfaceSpec } from '../hostSurfaceSpecTypes';
import type { ResolvedScriptProfileRegistry } from '../scriptProfileSpec';
import { luaGlobalHookName } from './luaGlobalHook';
import { zodToLuaTypeRef } from './zodToLuaTypeRef';
import { collectLuaTypeAliasesFromHostSpec, inferLuaTypeAliasesFromHostSpec } from './luaTypeAliasCollectors';

function zodInputToParams(
  input: z.ZodTypeAny,
  luaParamTypes: Partial<Record<string, string>> | undefined,
): NonNullable<
  NonNullable<Lua1TypeOverlay['bridgeMethods']>[string][string]['params']
> {
  const base = unwrapInputSchema(input);
  if (base instanceof z.ZodObject) {
    const shape = base.shape as Record<string, z.ZodTypeAny>;
    return Object.keys(shape).map((name) => ({
      name,
      luaType: luaParamTypes?.[name] ?? zodToLuaTypeRef(shape[name]!),
    }));
  }
  return [{ name: 'value', luaType: luaParamTypes?.value ?? zodToLuaTypeRef(base) }];
}

function unwrapInputSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
  let cur: z.ZodTypeAny = schema;
  if (cur instanceof z.ZodEffects) {
    cur = cur.innerType();
  }
  if (cur instanceof z.ZodPipeline) {
    cur = cur._def.in as z.ZodTypeAny;
  }
  return cur;
}

/** Builds {@link Lua1TypeOverlay} from Zod host surface data for `surfaceSpecToLuaDefManifest`. */
export function buildLua1TypeOverlay(
  spec: HostSurfaceSpec,
  componentTypes: ResolvedScriptProfileRegistry,
  componentHooks?: HostComponentHooksSpec,
): Lua1TypeOverlay {
  const bridgeMethods: NonNullable<Lua1TypeOverlay['bridgeMethods']> = Object.create(null) as NonNullable<
    Lua1TypeOverlay['bridgeMethods']
  >;

  for (const bridgeName of Object.keys(spec)) {
    const methods = spec[bridgeName]!;
    const methodOverlay: Record<string, NonNullable<Lua1TypeOverlay['bridgeMethods']>[string][string]> =
      Object.create(null) as Record<string, NonNullable<Lua1TypeOverlay['bridgeMethods']>[string][string]>;
    for (const methodName of Object.keys(methods)) {
      const entry = methods[methodName]!;
      const returns = entry.lua?.returns ?? zodToLuaTypeRef(entry.output);
      methodOverlay[methodName] = {
        params: zodInputToParams(entry.input, entry.lua?.paramTypes),
        returns,
        async: entry.async,
        description: entry.description,
      };
    }
    bridgeMethods[bridgeName] = methodOverlay;
  }

  const componentTypeOverlay: NonNullable<Lua1TypeOverlay['componentTypes']> = Object.create(
    null,
  ) as NonNullable<Lua1TypeOverlay['componentTypes']>;
  for (const name of Object.keys(componentTypes)) {
    const profile = componentTypes[name]!;
    componentTypeOverlay[name] = {
      propsLuaType: zodToLuaTypeRef(profile.props),
      stateLuaType: zodToLuaTypeRef(profile.state),
      hooks: [...profile.hooks],
    };
  }

  const hookPayloadFields: NonNullable<Lua1TypeOverlay['hookPayloadFields']> = Object.create(
    null,
  ) as NonNullable<Lua1TypeOverlay['hookPayloadFields']>;
  if (componentHooks !== undefined) {
    for (const kind of Object.keys(componentHooks)) {
      const schema = componentHooks[kind];
      if (schema instanceof z.ZodObject) {
        const shape = schema.shape as Record<string, z.ZodTypeAny>;
        hookPayloadFields[kind] = Object.keys(shape).map((k) => ({
          name: k,
          luaType: zodToLuaTypeRef(shape[k]!),
        }));
      }
    }
  }

  const aliases = [
    ...collectLuaTypeAliasesFromHostSpec(spec),
    ...inferLuaTypeAliasesFromHostSpec(spec),
  ];

  return {
    bridgeMethods,
    componentTypes: componentTypeOverlay,
    hookPayloadFields,
    aliases,
  };
}

export { luaGlobalHookName };
