import type { LuaDefManifest, ManifestAlias } from '@microverse.ts/lua-defs';

import { scriptProfileComponentClassName } from './scriptProfileSpec';

export type ScriptCatalogEntry = {
  readonly scriptId: string;
  readonly profileId: string;
};

/** LuaCATS aliases per catalog scriptId → resolved component class (for `---@type` in `.lua` files). */
export function buildScriptCatalogLuaDefManifest(
  entries: readonly ScriptCatalogEntry[],
): LuaDefManifest {
  const aliases: ManifestAlias[] = entries
    .slice()
    .sort((a, b) => a.scriptId.localeCompare(b.scriptId))
    .map((entry) => {
      const componentClass = scriptProfileComponentClassName(entry.profileId);
      const aliasName = scriptCatalogComponentAlias(entry.scriptId);
      return {
        name: aliasName,
        definition: componentClass,
      };
    });

  return {
    schemaVersion: 1,
    output: 'generated/scriptCatalog.d.lua',
    classes: [],
    aliases,
    globals: [],
    luaHooks: [],
  };
}

export function scriptCatalogComponentAlias(scriptId: string): string {
  const safe = scriptId.replace(/[^A-Za-z0-9_]/g, '_');
  return `${safe}ScriptComponent`;
}
