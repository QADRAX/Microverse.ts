import type { ChessInstanceSide } from '../engine/chessLabHost';

export const CHESS_LAB_RUNTIME_SUMMARY =
  'One MicroverseLua Wasm sandbox. Two ChessEngine script instances alternate moves on a shared board; rules live in TypeScript (chess.js), strategy in Lua.';

export function instancePanelTitle(side: ChessInstanceSide, engineLabel: string): string {
  const label = side === 'white' ? 'White' : 'Black';
  return `${label} — ${engineLabel}`;
}

export function instanceMetaLine(side: ChessInstanceSide): string {
  return `instanceId "${side}" · profile ChessEngine · hook onPickMove · bridges board, play, viz, game`;
}

export function instanceScriptNote(side: ChessInstanceSide): string {
  return `Mounted in the shared microverse. Step / Play invokes onPickMove only when it is ${side}'s turn.`;
}
