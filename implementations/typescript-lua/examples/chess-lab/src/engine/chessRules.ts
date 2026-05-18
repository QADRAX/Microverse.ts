import { Chess, type Color, type Move, type Square } from 'chess.js';

export const START_FEN = new Chess().fen();

export type ChessSide = 'white' | 'black';

export type ChessMovePayload = {
  readonly from: string;
  readonly to: string;
  readonly san: string;
  readonly promotion?: string;
  readonly captured?: string;
  readonly givesCheck: boolean;
};

export type ApplyMoveResult =
  | { readonly ok: true; readonly san: string }
  | { readonly ok: false; readonly error: string };

export function createGame(fen: string = START_FEN): Chess {
  return new Chess(fen);
}

/** Clone with full move history so chess.js repetition tracking stays accurate. */
export function cloneChessWithHistory(chess: Chess): Chess {
  const copy = createGame();
  for (const san of chess.history()) {
    copy.move(san);
  }
  return copy;
}

export function sideToColor(side: ChessSide): Color {
  return side === 'white' ? 'w' : 'b';
}

export function colorToSide(color: Color): ChessSide {
  return color === 'w' ? 'white' : 'black';
}

export function activeSide(chess: Chess): ChessSide {
  return colorToSide(chess.turn());
}

export function moveToPayload(move: Move): ChessMovePayload {
  return {
    from: move.from,
    to: move.to,
    san: move.san,
    givesCheck: move.san.includes('+') || move.san.includes('#'),
    ...(move.promotion !== undefined ? { promotion: move.promotion } : {}),
    ...(move.captured !== undefined ? { captured: move.captured } : {}),
  };
}

export function legalMovePayloads(chess: Chess): ChessMovePayload[] {
  return chess.moves({ verbose: true }).map(moveToPayload);
}

export function applyMove(
  chess: Chess,
  args: { readonly from: string; readonly to: string; readonly promotion?: string | undefined },
): ApplyMoveResult {
  try {
    const moveArg: { from: Square; to: Square; promotion?: 'q' | 'r' | 'b' | 'n' } = {
      from: args.from as Square,
      to: args.to as Square,
    };
    if (args.promotion !== undefined) {
      moveArg.promotion = args.promotion as 'q' | 'r' | 'b' | 'n';
    }
    const result = chess.move(moveArg);
    if (result === null) {
      return { ok: false, error: 'Illegal move' };
    }
    return { ok: true, san: result.san };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

/** FEN fields that define a position for repetition (board, side, castling, en passant). */
export function positionKey(fen: string): string {
  const parts = fen.split(' ');
  return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]}`;
}

/** How many times the current position has occurred (including this turn). */
export function positionRepetitionCount(chess: Chess): number {
  const key = positionKey(chess.fen());
  let count = 0;
  const replay = createGame();
  if (positionKey(replay.fen()) === key) {
    count += 1;
  }
  for (const san of chess.history()) {
    replay.move(san);
    if (positionKey(replay.fen()) === key) {
      count += 1;
    }
  }
  return count;
}

/** True if playing this move would claim a draw by threefold repetition. */
export function moveWouldCauseThreefoldRepetition(
  chess: Chess,
  args: { readonly from: string; readonly to: string; readonly promotion?: string | undefined },
): boolean | undefined {
  const copy = cloneChessWithHistory(chess);
  const applied = applyMove(copy, args);
  if (!applied.ok) {
    return undefined;
  }
  return positionRepetitionCount(copy) >= 3;
}

export function gameResult(chess: Chess): string | undefined {
  if (!chess.isGameOver()) {
    return undefined;
  }
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? '0-1' : '1-0';
  }
  if (chess.isDraw()) {
    if (chess.isStalemate()) {
      return '1/2-1/2 (stalemate)';
    }
    if (chess.isThreefoldRepetition()) {
      return '1/2-1/2 (repetition)';
    }
    if (chess.isInsufficientMaterial()) {
      return '1/2-1/2 (insufficient material)';
    }
    return '1/2-1/2';
  }
  return undefined;
}

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

/** Material balance from White's perspective (positive = White ahead). */
export function evaluateMaterial(chess: Chess): number {
  const board = chess.board();
  let score = 0;
  for (const row of board) {
    for (const piece of row) {
      if (piece === null) {
        continue;
      }
      const value = PIECE_VALUES[piece.type] ?? 0;
      score += piece.color === 'w' ? value : -value;
    }
  }
  return score;
}

/** Score from `forSide` perspective (material + small check bonus). */
export function evaluatePosition(chess: Chess, forSide: ChessSide): number {
  let score = evaluateMaterial(chess);
  if (forSide === 'black') {
    score = -score;
  }
  if (chess.isCheck() && activeSide(chess) !== forSide) {
    score += 0.5;
  }
  return score;
}

export function evaluateAfterMove(
  chess: Chess,
  args: { readonly from: string; readonly to: string; readonly promotion?: string | undefined },
  forSide: ChessSide,
): number | undefined {
  const copy = createGame(chess.fen());
  const applied = applyMove(copy, args);
  if (!applied.ok) {
    return undefined;
  }
  return evaluatePosition(copy, forSide);
}

/** True if, after the move, the piece on `to` is not attacked by the opponent. */
export function isMoveSafe(
  chess: Chess,
  args: { readonly from: string; readonly to: string; readonly promotion?: string | undefined },
  mover: ChessSide,
): boolean | undefined {
  const copy = createGame(chess.fen());
  const applied = applyMove(copy, args);
  if (!applied.ok) {
    return undefined;
  }
  if (activeSide(chess) !== mover) {
    return undefined;
  }
  return !copy.isAttacked(args.to as Square, copy.turn());
}

/** Minimax-style score after `move` with fixed depth (1 or 2 plies). */
export function searchScore(
  chess: Chess,
  args: {
    readonly from: string;
    readonly to: string;
    readonly promotion?: string | undefined;
    readonly depth: number;
  },
  forSide: ChessSide,
): number | undefined {
  const copy = createGame(chess.fen());
  const applied = applyMove(copy, { from: args.from, to: args.to, promotion: args.promotion });
  if (!applied.ok) {
    return undefined;
  }

  const depth = Math.max(1, Math.min(2, Math.floor(args.depth)));

  if (depth <= 1) {
    return evaluatePosition(copy, forSide);
  }

  const replies = legalMovePayloads(copy);
  if (replies.length === 0) {
    return evaluatePosition(copy, forSide);
  }

  let worst = Number.POSITIVE_INFINITY;
  for (const reply of replies) {
    const replyBoard = createGame(copy.fen());
    const replyApplied = applyMove(replyBoard, {
      from: reply.from,
      to: reply.to,
      promotion: reply.promotion,
    });
    if (!replyApplied.ok) {
      continue;
    }
    const score = evaluatePosition(replyBoard, forSide);
    if (score < worst) {
      worst = score;
    }
  }
  return worst === Number.POSITIVE_INFINITY ? evaluatePosition(copy, forSide) : worst;
}

export function isSquareAttackedByOpponent(chess: Chess, square: string, side: ChessSide): boolean {
  const attacker: Color = side === 'white' ? 'b' : 'w';
  return chess.isAttacked(square as Square, attacker);
}
