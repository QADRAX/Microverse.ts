import type { SurfaceSpecDocument } from '@microverse.ts/surface-spec';

import type {
  LuaDefManifest,
  ManifestAlias,
  ManifestClass,
  ManifestClassField,
  ManifestMethod,
} from '../../domain/manifest/LuaDefManifest';
import { jsonSchemaToLuaTypeRef } from './jsonSchemaToLuaTypeRef';
import { luaGlobalHookName } from './luaGlobalHookName';
import type { Lua1TypeOverlay, SurfaceSpecToLuaDefManifestOptions } from './Lua1TypeOverlay';

function scriptProfileComponentClassName(profileName: string): string {
  return `${profileName}Component`;
}

function scriptProfilePropsAlias(profileName: string): string {
  return `${profileName}Props`;
}

function scriptProfileStateAlias(profileName: string): string {
  return `${profileName}State`;
}

function scriptProfileBridgesClassName(profileName: string): string {
  return `${profileName}Bridges`;
}

function bridgeLuaClassName(bridgeTableName: string): string {
  return bridgeTableName.charAt(0).toUpperCase() + bridgeTableName.slice(1);
}

function asyncHandleClassName(bridgeName: string, methodName: string): string {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${cap(bridgeName)}${cap(methodName)}Handle`;
}

function pushBaseComponentClass(classes: ManifestClass[]): void {
  classes.push({
    name: 'Component',
    description: 'Base component lifecycle (extended by typed component profiles).',
    fields: [
      { name: 'init', luaType: 'fun(self: Component)' },
      { name: 'onPropsChanged', luaType: 'fun(self: Component, key: string, newValue: any)' },
      { name: 'onDestroy', luaType: 'fun(self: Component)' },
    ],
    emitSingleton: false,
  });
}

function pushComponentTypeManifest(
  classes: ManifestClass[],
  aliases: Map<string, string>,
  typeName: string,
  doc: SurfaceSpecDocument,
  overlay: Lua1TypeOverlay | undefined,
): void {
  const profile = doc.componentTypes[typeName]!;
  const typeOverlay = overlay?.componentTypes?.[typeName];
  const propsAlias = scriptProfilePropsAlias(typeName);
  const stateAlias = scriptProfileStateAlias(typeName);
  aliases.set(
    propsAlias,
    typeOverlay?.propsLuaType ?? jsonSchemaToLuaTypeRef(profile.props),
  );
  aliases.set(
    stateAlias,
    typeOverlay?.stateLuaType ?? jsonSchemaToLuaTypeRef(profile.state),
  );

  if (profile.bridgeNames.length > 0) {
    const bridgesName = scriptProfileBridgesClassName(typeName);
    classes.push({
      name: bridgesName,
      description: `Host bridges for \`${typeName}\` components.`,
      fields: profile.bridgeNames.map((name) => ({
        name,
        luaType: bridgeLuaClassName(name),
      })),
      emitSingleton: false,
    });
  }

  const componentClass = scriptProfileComponentClassName(typeName);
  const bridgesClass =
    profile.bridgeNames.length > 0 ? scriptProfileBridgesClassName(typeName) : 'table';
  const extendsClass =
    profile.extends !== undefined
      ? scriptProfileComponentClassName(profile.extends)
      : 'Component';

  const fields: ManifestClassField[] = [
    { name: 'properties', luaType: propsAlias },
    { name: 'state', luaType: stateAlias },
    { name: 'bridges', luaType: bridgesClass },
    { name: 'init', luaType: `fun(self: ${componentClass})` },
    { name: 'onPropsChanged', luaType: `fun(self: ${componentClass}, key: string, newValue: any)` },
    { name: 'onDestroy', luaType: `fun(self: ${componentClass})` },
  ];

  for (const kind of profile.hooks) {
    const payloadName = `MicroverseEvt_${kind}`;
    const hookName = luaGlobalHookName(kind);
    fields.push({
      name: hookName,
      luaType: `fun(self: ${componentClass}, evt: ${payloadName})`,
    });
    const payloadFields = overlay?.hookPayloadFields?.[kind];
    if (payloadFields !== undefined) {
      classes.push({
        name: payloadName,
        fields: payloadFields.map((f) => ({ name: f.name, luaType: f.luaType })),
        emitSingleton: false,
      });
    } else if (doc.componentHooks?.[kind] !== undefined) {
      const hookSchema = doc.componentHooks[kind];
      if (
        typeof hookSchema === 'object' &&
        hookSchema !== null &&
        'properties' in hookSchema
      ) {
        const props = (hookSchema as { properties: Record<string, unknown> }).properties;
        classes.push({
          name: payloadName,
          fields: Object.keys(props).map((k) => ({
            name: k,
            luaType: jsonSchemaToLuaTypeRef(props[k]),
          })),
          emitSingleton: false,
        });
      }
    }
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
    description: `Factory for \`${componentClass}\`.`,
    methods: [
      {
        name: 'extend',
        params: [],
        returns: componentClass,
      },
    ],
    emitSingleton: true,
  });
}

/**
 * Builds a {@link LuaDefManifest} from a {@link SurfaceSpecDocument} (profile `lua@1`).
 * Pass {@link Lua1TypeOverlay} from the Zod host surface for precise LuaCATS (nominal aliases, etc.).
 */
export function surfaceSpecToLuaDefManifest(
  doc: SurfaceSpecDocument,
  opts: SurfaceSpecToLuaDefManifestOptions,
): LuaDefManifest {
  const overlay = opts.luaTypeOverlay;
  const classes: ManifestClass[] = [];
  const aliases = new Map<string, string>();

  if (overlay?.aliases !== undefined) {
    for (const a of overlay.aliases) {
      aliases.set(a.name, a.definition);
    }
  }

  for (const bridgeName of Object.keys(doc.bridges).sort((a, b) => a.localeCompare(b))) {
    const methods = doc.bridges[bridgeName]!.methods;
    const manifestMethods: ManifestMethod[] = [];
    for (const methodName of Object.keys(methods).sort((a, b) => a.localeCompare(b))) {
      const entry = methods[methodName]!;
      const methodOverlay = overlay?.bridgeMethods?.[bridgeName]?.[methodName];
      const resultLua =
        methodOverlay?.returns ?? jsonSchemaToLuaTypeRef(entry.output);
      const async = methodOverlay?.async ?? entry.async === true;

      if (async) {
        const handleName = asyncHandleClassName(bridgeName, methodName);
        const payloadParams = methodOverlay?.params ?? [
          {
            name: 'payload',
            luaType: jsonSchemaToLuaTypeRef(entry.input),
          },
        ];
        manifestMethods.push({
          name: methodName,
          description: methodOverlay?.description ?? entry.description,
          callStyle: 'asyncBridge',
          params: [
            ...payloadParams,
            { name: 'onComplete', luaType: `fun(result: ${resultLua})|nil` },
          ],
          returns: handleName,
        });
        classes.push({
          name: handleName,
          fields: [{ name: 'await', luaType: `fun(self: ${handleName}): ${resultLua}` }],
          emitSingleton: false,
        });
      } else {
        manifestMethods.push({
          name: methodName,
          description: methodOverlay?.description ?? entry.description,
          params: methodOverlay?.params,
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

  pushBaseComponentClass(classes);
  for (const typeName of Object.keys(doc.componentTypes).sort((a, b) => a.localeCompare(b))) {
    pushComponentTypeManifest(classes, aliases, typeName, doc, overlay);
  }

  if (opts.luaTypeAliases !== undefined) {
    for (const [k, v] of Object.entries(opts.luaTypeAliases)) {
      aliases.set(k, v);
    }
  }

  const aliasList: ManifestAlias[] | undefined =
    aliases.size === 0
      ? undefined
      : [...aliases.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([name, definition]) => ({ name, definition }));

  return {
    schemaVersion: 1,
    output: opts.output,
    headerNote: opts.headerNote,
    aliases: aliasList,
    classes,
  };
}
