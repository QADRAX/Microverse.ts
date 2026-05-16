import type {
  LuaDefManifest,
  ManifestAlias,
  ManifestClass,
  ManifestClassField,
  ManifestMethod,
  ManifestParam,
} from '@microverse.ts/lua-defs';
import { z } from 'zod';

import {
  scriptProfileBridgesClassName,
  scriptProfileComponentClassName,
  scriptProfilePropsAlias,
  scriptProfileStateAlias,
  type ResolvedScriptProfile,
  type ResolvedScriptProfileRegistry,
} from './scriptProfileSpec';
import type { HostSurfaceSpec, HostComponentHooksSpec } from './hostSurfaceTypes';
import { luaGlobalHookName } from './luaGlobalHook';
import { isLuaTypeAtom } from './luaTypeAtoms';
import { getLuaTypeRegistrationRoot, getRegisteredLuaTypeName } from './zodLuaType';
import { zodToLuaTypeRef } from './zodToLuaTypeRef';

function asyncHandleClassName(bridgeName: string, methodName: string): string {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${cap(bridgeName)}${cap(methodName)}Handle`;
}

/** LuaCATS class for runtime bridge key `audit` → `Audit` (distinct from field name for LuaLS). */
function bridgeLuaClassName(bridgeTableName: string): string {
  return bridgeTableName.charAt(0).toUpperCase() + bridgeTableName.slice(1);
}

function buildComponentEventManifestFields(
  kinds: readonly string[],
  componentClassName: string,
  componentHooks: HostComponentHooksSpec,
): ManifestClassField[] {
  const out: ManifestClassField[] = [];
  for (const kind of kinds) {
    const schema = componentHooks[kind];
    if (!(schema instanceof z.ZodObject)) {
      throw new Error(`defineHostSurface componentHooks: "${kind}" must be a z.object(...)`);
    }
    const payloadName = `MicroverseEvt_${kind}`;
    const hookName = luaGlobalHookName(kind);
    out.push({
      name: hookName,
      description: `Host invokes when \`${kind}\` is emitted. Payload: \`${payloadName}\`.`,
      luaType: `fun(self: ${componentClassName}, evt: ${payloadName})`,
    });
  }
  return out;
}

function pushComponentEventPayloadClasses(
  kinds: readonly string[],
  componentHooks: HostComponentHooksSpec,
  classes: ManifestClass[],
): void {
  for (const kind of kinds) {
    const schema = componentHooks[kind];
    if (!(schema instanceof z.ZodObject)) {
      throw new Error(`defineHostSurface componentHooks: "${kind}" must be a z.object(...)`);
    }
    const name = `MicroverseEvt_${kind}`;
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    classes.push({
      name,
      description: `Domain event payload for \`${luaGlobalHookName(kind)}\` (Zod → LuaCATS fields).`,
      fields: Object.keys(shape).map((k) => ({
        name: k,
        luaType: zodToLuaTypeRef(shape[k]!),
      })),
      emitSingleton: false,
    });
  }
}

function pushBaseComponentClass(classes: ManifestClass[]): void {
  classes.push({
    name: 'Component',
    description: 'Base component lifecycle (extended by typed component profiles).',
    fields: [
      {
        name: 'init',
        luaType: 'fun(self: Component)',
        description: 'Called once after mount and initial props are applied.',
      },
      {
        name: 'onPropsChanged',
        luaType: 'fun(self: Component, key: string, newValue: any)',
        description: 'Called when the host patches a property key.',
      },
      {
        name: 'onDestroy',
        luaType: 'fun(self: Component)',
        description: 'Called before the script instance slot is disposed.',
      },
    ],
    emitSingleton: false,
  });
}

function pushProfileBridgesClass(typeName: string, bridgeNames: readonly string[], classes: ManifestClass[]): void {
  if (bridgeNames.length === 0) {
    return;
  }
  const bridgesName = scriptProfileBridgesClassName(typeName);
  classes.push({
    name: bridgesName,
    description: `Host bridges for \`${typeName}\` components (\`self.bridges\` after \`${typeName}:extend()\`).`,
    fields: bridgeNames.map((name) => ({
      name,
      luaType: bridgeLuaClassName(name),
    })),
    emitSingleton: false,
  });
}

function pushComponentTypeManifest(
  classes: ManifestClass[],
  aliases: Map<string, string>,
  typeName: string,
  profile: ResolvedScriptProfile,
  componentHooks: HostComponentHooksSpec | undefined,
): void {
  const propsAlias = scriptProfilePropsAlias(typeName);
  const stateAlias = scriptProfileStateAlias(typeName);
  aliases.set(propsAlias, zodToLuaTypeRef(profile.props));
  aliases.set(stateAlias, zodToLuaTypeRef(profile.state));

  pushProfileBridgesClass(typeName, profile.bridgeNames, classes);

  const componentClass = scriptProfileComponentClassName(typeName);
  const bridgesClass = profile.bridgeNames.length > 0 ? scriptProfileBridgesClassName(typeName) : 'table';
  const extendsClass =
    profile.extends !== undefined ? scriptProfileComponentClassName(profile.extends) : 'Component';

  const fields: ManifestClassField[] = [
    { name: 'properties', luaType: propsAlias, description: 'Host-synced props (proxy).' },
    { name: 'state', luaType: stateAlias, description: 'Lua-local state.' },
    {
      name: 'bridges',
      luaType: bridgesClass,
      description: 'Host bridges allowed for this component type.',
    },
    {
      name: 'init',
      luaType: `fun(self: ${componentClass})`,
      description: 'Called once after mount and initial props are applied.',
    },
    {
      name: 'onPropsChanged',
      luaType: `fun(self: ${componentClass}, key: string, newValue: any)`,
      description: 'Called when the host patches a property key.',
    },
    {
      name: 'onDestroy',
      luaType: `fun(self: ${componentClass})`,
      description: 'Called before the script instance slot is disposed.',
    },
  ];

  if (componentHooks !== undefined && profile.hooks.length > 0) {
    fields.push(...buildComponentEventManifestFields(profile.hooks, componentClass, componentHooks));
  }

  classes.push({
    name: componentClass,
    extendsClass,
    description: `Component instance from \`local C = ${typeName}:extend()\`.`,
    fields,
    emitSingleton: false,
  });

  classes.push({
    name: typeName,
    description: `Factory for \`${componentClass}\` in this slot.`,
    methods: [
      {
        name: 'extend',
        description: 'Creates the active component with profile-scoped bridges.',
        params: [],
        returns: componentClass,
      },
    ],
    emitSingleton: true,
  });
}

function pushComponentManifestClasses(
  classes: ManifestClass[],
  aliases: Map<string, string>,
  componentTypes: ResolvedScriptProfileRegistry,
  componentHooks?: HostComponentHooksSpec,
): void {
  const eventKinds =
    componentHooks !== undefined
      ? Object.keys(componentHooks).sort((a, b) => a.localeCompare(b))
      : [];
  if (componentHooks !== undefined) {
    pushComponentEventPayloadClasses(eventKinds, componentHooks, classes);
  }
  pushBaseComponentClass(classes);
  const typeNames = Object.keys(componentTypes).sort((a, b) => a.localeCompare(b));
  for (const typeName of typeNames) {
    pushComponentTypeManifest(classes, aliases, typeName, componentTypes[typeName]!, componentHooks);
  }
}

export function buildLuaDefManifestFromHostSurfaceSpec(
  spec: HostSurfaceSpec,
  opts: {
    readonly output: string;
    readonly headerNote?: string | undefined;
    readonly luaTypeAliases?: Readonly<Record<string, string>> | undefined;
  },
  componentHooks?: HostComponentHooksSpec,
  componentTypes?: ResolvedScriptProfileRegistry,
): LuaDefManifest {
  const classes: ManifestClass[] = [];
  const bridgeNames = Object.keys(spec).sort((a, b) => a.localeCompare(b));
  for (const bridgeName of bridgeNames) {
    const methods = spec[bridgeName]!;
    const manifestMethods: ManifestMethod[] = [];
    for (const methodName of Object.keys(methods)) {
      const entry = methods[methodName]!;
      const resultLua = entry.lua?.returns ?? zodToLuaTypeRef(entry.output);
      if (entry.async === true) {
        const handleName = asyncHandleClassName(bridgeName, methodName);
        const payloadParams = zodInputToManifestParams(entry.input, entry.lua?.paramTypes) ?? [];
        manifestMethods.push({
          name: methodName,
          description: entry.description,
          callStyle: 'asyncBridge',
          params: [
            ...payloadParams,
            { name: 'onComplete', luaType: `fun(result: ${resultLua})|nil` },
          ],
          returns: handleName,
        });
        classes.push({
          name: handleName,
          description: `Async handle for \`${bridgeName}:${methodName}\`. Call \`:await()\` for the resolved value.`,
          fields: [{ name: 'await', luaType: `fun(self: ${handleName}): ${resultLua}` }],
          emitSingleton: false,
        });
      } else {
        manifestMethods.push({
          name: methodName,
          description: entry.description,
          params: zodInputToManifestParams(entry.input, entry.lua?.paramTypes),
          returns: resultLua,
        });
      }
    }
    classes.push({
      name: bridgeLuaClassName(bridgeName),
      methods: manifestMethods,
      emitSingleton: false,
    });
  }
  const fromLuaType = collectLuaTypeAliasesFromHostSpec(spec);
  const fromOverrides = inferLuaTypeAliasesFromHostSpec(spec);
  const merged = new Map<string, string>([
    ...fromLuaType.map((a) => [a.name, a.definition] as const),
    ...fromOverrides.map((a) => [a.name, a.definition] as const),
  ]);
  if (opts.luaTypeAliases !== undefined) {
    for (const [k, v] of Object.entries(opts.luaTypeAliases)) {
      merged.set(k, v);
    }
  }

  if (componentTypes !== undefined) {
    pushComponentManifestClasses(classes, merged, componentTypes, componentHooks);
  }

  const aliases =
    merged.size === 0
      ? undefined
      : [...merged.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, definition]) => ({ name, definition }));

  return {
    schemaVersion: 1,
    output: opts.output,
    headerNote: opts.headerNote,
    aliases,
    classes,
  };
}

function nominalTokensFromLuaReturnString(retLua: string): readonly string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const segment of retLua.split('|')) {
    const s = segment.trim();
    if (!/^[A-Za-z_]\w*$/.test(s)) {
      continue;
    }
    if (isLuaTypeAtom(s)) {
      continue;
    }
    if (seen.has(s)) {
      continue;
    }
    seen.add(s);
    out.push(s);
  }
  return out;
}

function unwrapOutputBaseForAlias(schema: z.ZodTypeAny): z.ZodTypeAny {
  /* eslint-disable @typescript-eslint/no-unsafe-assignment -- Zod internal unwrap chain */
  let cur: z.ZodTypeAny = schema;
  for (;;) {
    if (cur instanceof z.ZodOptional || cur instanceof z.ZodNullable) {
      cur = cur.unwrap();
      continue;
    }
    if (cur instanceof z.ZodDefault) {
      cur = cur.removeDefault();
      continue;
    }
    if (cur instanceof z.ZodReadonly) {
      cur = cur.unwrap();
      continue;
    }
    if (cur instanceof z.ZodEffects) {
      cur = cur.innerType();
      continue;
    }
    if (cur instanceof z.ZodPipeline) {
      cur = cur._def.out as z.ZodTypeAny;
      continue;
    }
    break;
  }
  /* eslint-enable @typescript-eslint/no-unsafe-assignment */
  return cur;
}

function collectLuaTypeAliasesFromHostSpec(spec: HostSurfaceSpec): readonly ManifestAlias[] {
  const byName = new Map<string, string>();
  const seenRoots = new Set<z.ZodTypeAny>();

  const consider = (schema: z.ZodTypeAny): void => {
    const root = getLuaTypeRegistrationRoot(schema);
    if (root === undefined || seenRoots.has(root)) {
      return;
    }
    const name = getRegisteredLuaTypeName(root);
    if (name === undefined) {
      return;
    }
    seenRoots.add(root);
    const definition = zodToLuaTypeRef(root, { emitAliasNames: false });
    if (definition !== name) {
      byName.set(name, definition);
    }
  };

  const walk = (schema: z.ZodTypeAny): void => {
    consider(schema);
    const base = unwrapInputSchema(schema);
    if (base instanceof z.ZodObject) {
      const shape = base.shape as Record<string, z.ZodTypeAny>;
      for (const field of Object.values(shape)) {
        consider(field);
      }
    }
  };

  for (const bridgeName of Object.keys(spec)) {
    const methods = spec[bridgeName]!;
    for (const methodName of Object.keys(methods)) {
      const entry = methods[methodName]!;
      walk(entry.input);
      walk(entry.output);
    }
  }

  return [...byName.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, definition]) => ({ name, definition }));
}

function inferLuaTypeAliasesFromHostSpec(spec: HostSurfaceSpec): readonly ManifestAlias[] {
  const byName = new Map<string, string>();

  for (const bridgeName of Object.keys(spec)) {
    const methods = spec[bridgeName]!;
    for (const methodName of Object.keys(methods)) {
      const entry = methods[methodName]!;

      const luaParams = entry.lua?.paramTypes;
      if (luaParams !== undefined) {
        const baseInput = unwrapInputSchema(entry.input);
        if (baseInput instanceof z.ZodObject) {
          const shape = baseInput.shape as Record<string, z.ZodTypeAny>;
          for (const [key, L] of Object.entries(luaParams)) {
            if (typeof L !== 'string') {
              continue;
            }
            if (!/^[A-Za-z_]\w*$/.test(L) || isLuaTypeAtom(L)) {
              continue;
            }
            const field = shape[key];
            if (field === undefined) {
              continue;
            }
            const def = zodToLuaTypeRef(field);
            if (L !== def) {
              byName.set(L, def);
            }
          }
        }
      }

      const retLua = entry.lua?.returns;
      if (typeof retLua === 'string' && retLua.length > 0) {
        for (const T of nominalTokensFromLuaReturnString(retLua)) {
          const baseOut = unwrapOutputBaseForAlias(entry.output);
          const def = zodToLuaTypeRef(baseOut);
          if (T !== def) {
            byName.set(T, def);
          }
        }
      }
    }
  }

  return [...byName.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, definition]) => ({ name, definition }));
}

function zodInputToManifestParams(
  input: z.ZodTypeAny,
  luaParamTypes: Partial<Record<string, string>> | undefined,
): ManifestParam[] | undefined {
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- ZodEffects.innerType()
    cur = cur.innerType();
  }
  if (cur instanceof z.ZodPipeline) {
    cur = cur._def.in as z.ZodTypeAny;
  }
  return cur;
}
