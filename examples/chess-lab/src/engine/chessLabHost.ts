import type { ScriptInstanceContext } from '@microverse.ts/microverse-lua';
import type { TaggedLuaMicroverseHost } from '@microverse.ts/microverse-lua';
import type { Chess } from 'chess.js';

import type { ChessComponentHooksSpec } from './chessHooks';
import {
  START_FEN,
  activeSide,
  createGame,
  positionRepetitionCount,
  type ChessSide,
} from './chessRules';

export type ChessInstanceSide = 'white' | 'black';

export type ChessMoveHighlight = {
  readonly from: string;
  readonly to: string;
  readonly san: string;
};

export type ChessVizSnapshot = {
  readonly message?: string;
  readonly highlights: readonly string[];
  readonly lastMove?: ChessMoveHighlight;
};

export type ChessBoardSnapshot = {
  readonly fen: string;
  readonly turn: ChessSide;
  readonly ply: number;
  /** How many times this position has occurred (1 = first time). */
  readonly positionRepeats: number;
  readonly lastMove?: ChessMoveHighlight;
  readonly highlights: readonly string[];
  readonly gameOver: boolean;
  readonly result?: string;
  readonly message?: string;
};

export type ChessLabHostState = {
  chess: Chess;
  ply: number;
  stepIndex: number;
  moveSubmittedThisStep: boolean;
  board: ChessBoardSnapshot;
  vizWhite: ChessVizSnapshot;
  vizBlack: ChessVizSnapshot;
};

export type ChessLabHost = TaggedLuaMicroverseHost<ChessComponentHooksSpec, ChessLabHostState>;

export function sideFromScript(script: ScriptInstanceContext): ChessInstanceSide {
  if (script.instanceId === 'black') {
    return 'black';
  }
  return 'white';
}

export function vizForSide(host: ChessLabHostState, side: ChessInstanceSide): ChessVizSnapshot {
  return side === 'white' ? host.vizWhite : host.vizBlack;
}

export function syncBoardSnapshot(host: ChessLabHostState): void {
  const { chess } = host;
  const prev = host.board;
  host.board = {
    fen: chess.fen(),
    turn: activeSide(chess),
    ply: host.ply,
    positionRepeats: positionRepetitionCount(chess),
    highlights: [...prev.highlights],
    gameOver: chess.isGameOver(),
    ...(prev.lastMove !== undefined ? { lastMove: prev.lastMove } : {}),
    ...(prev.result !== undefined ? { result: prev.result } : {}),
    ...(prev.message !== undefined ? { message: prev.message } : {}),
  };
}

const emptyViz = (): ChessVizSnapshot => ({
  highlights: [],
});

export function createChessLabHost(chess: Chess): ChessLabHostState {
  const board: ChessBoardSnapshot = {
    fen: chess.fen(),
    turn: activeSide(chess),
    ply: 0,
    positionRepeats: positionRepetitionCount(chess),
    highlights: [],
    gameOver: chess.isGameOver(),
  };
  return {
    chess,
    ply: 0,
    stepIndex: 0,
    moveSubmittedThisStep: false,
    board,
    vizWhite: emptyViz(),
    vizBlack: emptyViz(),
  };
}

export function resetChessHost(host: ChessLabHostState, fen: string = START_FEN): void {
  host.chess = createGame(fen);
  host.ply = 0;
  host.stepIndex = 0;
  host.moveSubmittedThisStep = false;
  host.vizWhite = emptyViz();
  host.vizBlack = emptyViz();
  host.board = {
    fen: host.chess.fen(),
    turn: activeSide(host.chess),
    ply: 0,
    positionRepeats: positionRepetitionCount(host.chess),
    highlights: [],
    gameOver: host.chess.isGameOver(),
  };
}
