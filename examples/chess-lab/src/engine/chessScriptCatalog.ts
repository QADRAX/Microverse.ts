import { CHESS_ENGINE_PROFILE } from './chessEngineProfile';

export const CHESS_PROFILE_ID = 'ChessEngine' as const;

export const chessScriptCatalog = {
  random_move: {
    label: 'Random move',
    description:
      'Chooses a legal move using a deterministic index from the ply (Wasm-safe pseudo-random). Good baseline opponent.',
    profile: CHESS_ENGINE_PROFILE,
    localComponentClass: true,
  },
  first_legal: {
    label: 'First legal move',
    description: 'Always plays the first move returned by chess.js. Fully deterministic—useful for debugging.',
    profile: CHESS_ENGINE_PROFILE,
  },
  capture_first: {
    label: 'Capture first',
    description: 'If any capture exists, picks one deterministically by ply; otherwise plays a pseudo-random legal move.',
    profile: CHESS_ENGINE_PROFILE,
  },
  greedy_material: {
    label: 'Greedy material',
    description: 'Captures the highest-value piece when possible; otherwise falls back to pseudo-random legal moves.',
    profile: CHESS_ENGINE_PROFILE,
  },
  prefer_checks: {
    label: 'Prefer checks',
    description: 'Prioritizes giving check, then captures, then a random legal move—aggressive but shallow.',
    profile: CHESS_ENGINE_PROFILE,
  },
  avoid_hanging: {
    label: 'Avoid hanging',
    description:
      'Prefers moves that do not land on a square attacked by the opponent (one-ply safety); captures still allowed.',
    profile: CHESS_ENGINE_PROFILE,
  },
  minimax_depth1: {
    label: 'Minimax depth 1',
    description:
      'One-ply minimax using host material evaluation (evaluateAfterMove). Strongest built-in engine in this lab.',
    profile: CHESS_ENGINE_PROFILE,
  },
  minimax_depth2: {
    label: 'Minimax depth 2',
    description: 'Two-ply minimax via board:searchScore (host simulates your move and every legal reply).',
    profile: CHESS_ENGINE_PROFILE,
  },
  capture_highest_safe: {
    label: 'Capture highest (safe)',
    description: 'Takes the most valuable legal capture where board:isMoveSafe passes; otherwise minimax depth 1.',
    profile: CHESS_ENGINE_PROFILE,
  },
  center_control: {
    label: 'Center control',
    description: 'Prefers moves landing on central squares (d/e files, ranks 4–5), scored in Lua.',
    profile: CHESS_ENGINE_PROFILE,
  },
  develop_knights: {
    label: 'Develop knights',
    description: 'Develops knights toward the center when possible; otherwise depth-1 search.',
    profile: CHESS_ENGINE_PROFILE,
  },
  opening_book_starter: {
    label: 'Opening book (starter)',
    description: 'Hard-coded opening lines for both colors, then falls back to minimax depth 2.',
    profile: CHESS_ENGINE_PROFILE,
  },
  hybrid_aggressive: {
    label: 'Hybrid aggressive',
    description: 'Checks → safe best capture → minimax depth 2; uses isMoveSafe and searchScore bridges.',
    profile: CHESS_ENGINE_PROFILE,
  },
} as const;

export type ChessScriptId = keyof typeof chessScriptCatalog;

export const chessScriptIds = Object.keys(chessScriptCatalog) as ChessScriptId[];

export function catalogEntryLabel(scriptId: ChessScriptId): string {
  return chessScriptCatalog[scriptId].label;
}

export function catalogEntryDescription(scriptId: ChessScriptId): string {
  return chessScriptCatalog[scriptId].description;
}
