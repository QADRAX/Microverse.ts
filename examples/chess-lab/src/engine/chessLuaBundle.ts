import avoidHanging from '../../lua/avoid_hanging.lua?raw';
import captureFirst from '../../lua/capture_first.lua?raw';
import captureHighestSafe from '../../lua/capture_highest_safe.lua?raw';
import centerControl from '../../lua/center_control.lua?raw';
import developKnights from '../../lua/develop_knights.lua?raw';
import firstLegal from '../../lua/first_legal.lua?raw';
import greedyMaterial from '../../lua/greedy_material.lua?raw';
import helpers from '../../lua/helpers.lua?raw';
import hybridAggressive from '../../lua/hybrid_aggressive.lua?raw';
import minimaxDepth1 from '../../lua/minimax_depth1.lua?raw';
import minimaxDepth2 from '../../lua/minimax_depth2.lua?raw';
import openingBookStarter from '../../lua/opening_book_starter.lua?raw';
import preferChecks from '../../lua/prefer_checks.lua?raw';
import randomMove from '../../lua/random_move.lua?raw';

import type { ChessScriptId } from './chessScriptCatalog';

export const chessLuaHelpers = helpers;

export const chessLuaSources: Record<ChessScriptId, string> = {
  random_move: randomMove,
  first_legal: firstLegal,
  capture_first: captureFirst,
  greedy_material: greedyMaterial,
  prefer_checks: preferChecks,
  avoid_hanging: avoidHanging,
  minimax_depth1: minimaxDepth1,
  minimax_depth2: minimaxDepth2,
  capture_highest_safe: captureHighestSafe,
  center_control: centerControl,
  develop_knights: developKnights,
  opening_book_starter: openingBookStarter,
  hybrid_aggressive: hybridAggressive,
};

export function chessLuaScriptPath(scriptId: ChessScriptId): string {
  return `lua/${scriptId}.lua`;
}

export function chessLuaSource(scriptId: ChessScriptId): string {
  return chessLuaSources[scriptId];
}
