import type { LuaScriptDefinition } from '@microverse.ts/microverse-lua';

import { chessLuaHelpers, chessLuaSources } from './chessLuaBundle';
import {
  CHESS_PROFILE_ID,
  chessScriptCatalog,
  type ChessScriptId,
} from './chessScriptCatalog';

export function chessScriptDefinition(scriptId: ChessScriptId): LuaScriptDefinition {
  const entry = chessScriptCatalog[scriptId];
  return {
    scriptId,
    source: chessLuaSources[scriptId],
    profile: entry.profile,
    profileId: CHESS_PROFILE_ID,
    injectLuaChunks: [chessLuaHelpers],
  };
}
