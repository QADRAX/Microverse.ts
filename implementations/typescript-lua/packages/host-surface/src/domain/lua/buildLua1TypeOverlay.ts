import type { Lua1TypeOverlay } from '@microverse.ts/lua-defs';
import { z } from 'zod';

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
    cur = cur.innerType() as z.ZodTypeAny;
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
  type BridgeMethodOverlay = NonNullable<
    NonNullable<Lua1TypeOverlay['bridgeMethods']>[string]
  >[string];
  const bridgeMethods: Record<string, Record<string, BridgeMethodOverlay>> = Object.create(
    null,
  ) as Record<string, Record<string, BridgeMethodOverlay>>;

  for (const bridgeName of Object.keys(spec)) {
    const methods = spec[bridgeName]!;
    const methodOverlay: Record<string, BridgeMethodOverlay> = Object.create(
      null,
    ) as Record<string, BridgeMethodOverlay>;
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

  type ComponentTypeOverlay = NonNullable<Lua1TypeOverlay['componentTypes']>[string];
  const componentTypeOverlay: Record<string, ComponentTypeOverlay> = Object.create(
    null,
  ) as Record<string, ComponentTypeOverlay>;
  for (const name of Object.keys(componentTypes)) {
    const profile = componentTypes[name]!;
    componentTypeOverlay[name] = {
      propsLuaType: zodToLuaTypeRef(profile.props),
      stateLuaType: zodToLuaTypeRef(profile.state),
      hooks: [...profile.hooks],
    };
  }

  type HookFieldList = NonNullable<Lua1TypeOverlay['hookPayloadFields']>[string];
  const hookPayloadFields: Record<string, HookFieldList> = Object.create(
    null,
  ) as Record<string, HookFieldList>;
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
