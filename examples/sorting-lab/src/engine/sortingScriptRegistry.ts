import type { LuaScriptDefinition } from '@microverse.ts/microverse-lua';

import { sortingLuaSources } from './sortingLuaBundle';
import {
  SORTING_PROFILE_ID,
  sortingScriptCatalog,
  type SortingScriptId,
} from './sortingScriptCatalog';

export function sortingScriptDefinition(scriptId: SortingScriptId): LuaScriptDefinition {
  const entry = sortingScriptCatalog[scriptId];
  return {
    scriptId,
    source: sortingLuaSources[scriptId],
    profile: entry.profile,
    profileId: SORTING_PROFILE_ID,
  };
}
