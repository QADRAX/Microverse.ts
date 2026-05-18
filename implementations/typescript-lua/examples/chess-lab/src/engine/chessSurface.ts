import { defineHostSurfaceFor } from '@microverse.ts/microverse-lua';
import { z } from 'zod';

import { CHESS_ENGINE_PROFILE } from './chessEngineProfile';
import {
  sideFromScript,
  syncBoardSnapshot,
  vizForSide,
  type ChessLabHost,
} from './chessLabHost';
import { chessComponentHooks } from './chessHooks';
import {
  activeSide,
  applyMove,
  evaluateAfterMove,
  evaluateMaterial,
  evaluatePosition,
  gameResult,
  moveWouldCauseThreefoldRepetition,
  isMoveSafe,
  positionRepetitionCount,
  isSquareAttackedByOpponent,
  legalMovePayloads,
  searchScore,
} from './chessRules';

export { chessComponentHooks } from './chessHooks';

const squareSchema = z.string().min(2).max(2);

const chessMoveSchema = z.object({
  from: squareSchema,
  to: squareSchema,
  san: z.string(),
  promotion: z.string().optional(),
  captured: z.string().optional(),
  givesCheck: z.boolean(),
});

const submitMoveInput = z.object({
  from: squareSchema,
  to: squareSchema,
  promotion: z.string().optional(),
});

export default defineHostSurfaceFor<ChessLabHost>()
  .componentType('ChessEngine', CHESS_ENGINE_PROFILE)
  .bridge('board')
  .method('fen', {
    requires: 'board:read',
    input: z.object({}),
    output: z.string(),
    handler: ({ host }) => host.chess.fen(),
  })
  .bridge('board')
  .method('pieceAt', {
    requires: 'board:read',
    input: z.object({ square: squareSchema }),
    output: z
      .object({
        type: z.string(),
        color: z.enum(['w', 'b']),
      })
      .nullable(),
    handler: ({ host }, { square }) => {
      const piece = host.chess.get(square as Parameters<typeof host.chess.get>[0]);
      return piece ?? null;
    },
  })
  .bridge('board')
  .method('legalMoves', {
    requires: 'board:read',
    input: z.object({}),
    output: z.array(chessMoveSchema),
    handler: ({ host }) => legalMovePayloads(host.chess),
  })
  .bridge('board')
  .method('isCheck', {
    requires: 'board:read',
    input: z.object({}),
    output: z.boolean(),
    handler: ({ host }) => host.chess.isCheck(),
  })
  .bridge('board')
  .method('isGameOver', {
    requires: 'board:read',
    input: z.object({}),
    output: z.boolean(),
    handler: ({ host }) => host.chess.isGameOver(),
  })
  .bridge('board')
  .method('moveWouldThreefold', {
    requires: 'board:read',
    input: submitMoveInput,
    output: z.boolean(),
    description:
      'True if this legal move would repeat the position a third time (draw by repetition).',
    handler: ({ host }, args) => moveWouldCauseThreefoldRepetition(host.chess, args) ?? false,
  })
  .bridge('board')
  .method('evaluate', {
    requires: 'board:read',
    input: z.object({}),
    output: z.number(),
    description: 'Material balance from White perspective (positive = White ahead).',
    handler: ({ host }) => evaluateMaterial(host.chess),
  })
  .bridge('board')
  .method('evaluateAfterMove', {
    requires: 'board:read',
    input: submitMoveInput,
    output: z.number().nullable(),
    description: 'Material score after move from the moving side perspective (simulated, does not apply).',
    handler: ({ host, script }, payload) => {
      const side = sideFromScript(script);
      const score = evaluateAfterMove(host.chess, payload, side);
      return score ?? null;
    },
  })
  .bridge('board')
  .method('isMoveSafe', {
    requires: 'board:read',
    input: submitMoveInput,
    output: z.boolean().nullable(),
    description: 'After the move, true if the moved piece is not attacked by the opponent (simulated).',
    handler: ({ host, script }, payload) => {
      const side = sideFromScript(script);
      const safe = isMoveSafe(host.chess, payload, side);
      return safe ?? null;
    },
  })
  .bridge('board')
  .method('searchScore', {
    requires: 'board:read',
    input: submitMoveInput.extend({
      depth: z.number().int().min(1).max(2),
    }),
    output: z.number().nullable(),
    description: 'Minimax score for a move at depth 1 or 2 (material + check bonus, simulated).',
    handler: ({ host, script }, payload) => {
      const side = sideFromScript(script);
      const score = searchScore(host.chess, payload, side);
      return score ?? null;
    },
  })
  .bridge('board')
  .method('evaluatePosition', {
    requires: 'board:read',
    input: z.object({}),
    output: z.number(),
    description: 'Current position score from my perspective (material + check bonus).',
    handler: ({ host, script }) => evaluatePosition(host.chess, sideFromScript(script)),
  })
  .bridge('board')
  .method('isSquareAttacked', {
    requires: 'board:read',
    input: z.object({ square: squareSchema }),
    output: z.boolean(),
    description: 'True if the square is attacked by the opponent of the side to move.',
    handler: ({ host }, { square }) =>
      isSquareAttackedByOpponent(host.chess, square, activeSide(host.chess)),
  })
  .bridge('play')
  .method('submitMove', {
    requires: 'play:move',
    input: submitMoveInput,
    output: z.object({ ok: z.boolean(), san: z.string().optional(), error: z.string().optional() }),
    handler: ({ host, script }, { from, to, promotion }) => {
      const side = sideFromScript(script);
      if (activeSide(host.chess) !== side) {
        return { ok: false, error: `Not ${side}'s turn` };
      }
      const applied = applyMove(host.chess, { from, to, promotion });
      if (!applied.ok) {
        return { ok: false, error: applied.error };
      }
      host.moveSubmittedThisStep = true;
      host.ply += 1;
      const lastMove = { from, to, san: applied.san };
      const viz = vizForSide(host, side);
      const nextViz = { ...viz, lastMove, message: applied.san };
      if (side === 'white') {
        host.vizWhite = nextViz;
      } else {
        host.vizBlack = nextViz;
      }
      const result = gameResult(host.chess);
      const message = result ?? applied.san;
      host.board = {
        fen: host.chess.fen(),
        turn: activeSide(host.chess),
        ply: host.ply,
        positionRepeats: positionRepetitionCount(host.chess),
        lastMove,
        highlights: [from, to],
        gameOver: host.chess.isGameOver(),
        message,
        ...(result !== undefined ? { result } : {}),
      };
      syncBoardSnapshot(host);
      return { ok: true, san: applied.san };
    },
  })
  .bridge('viz')
  .method('highlight', {
    requires: 'viz:emit',
    input: z.object({ squares: z.array(squareSchema) }),
    output: z.undefined(),
    handler: ({ host, script }, { squares }) => {
      const side = sideFromScript(script);
      const viz = vizForSide(host, side);
      const next = { ...viz, highlights: [...squares] };
      if (side === 'white') {
        host.vizWhite = next;
      } else {
        host.vizBlack = next;
      }
      host.board = { ...host.board, highlights: [...squares] };
      return undefined;
    },
  })
  .bridge('viz')
  .method('markLastMove', {
    requires: 'viz:emit',
    input: z.object({ from: squareSchema, to: squareSchema }),
    output: z.undefined(),
    handler: ({ host, script }, { from, to }) => {
      const side = sideFromScript(script);
      const viz = vizForSide(host, side);
      const next = { ...viz, highlights: [from, to] };
      if (side === 'white') {
        host.vizWhite = next;
      } else {
        host.vizBlack = next;
      }
      host.board = { ...host.board, highlights: [from, to] };
      return undefined;
    },
  })
  .bridge('viz')
  .method('note', {
    requires: 'viz:emit',
    input: z.object({ message: z.string() }),
    output: z.undefined(),
    handler: ({ host, script }, { message }) => {
      const side = sideFromScript(script);
      const viz = vizForSide(host, side);
      const next = { ...viz, message };
      if (side === 'white') {
        host.vizWhite = next;
      } else {
        host.vizBlack = next;
      }
      return undefined;
    },
  })
  .bridge('game')
  .method('myColor', {
    requires: 'game:read',
    input: z.object({}),
    output: z.enum(['white', 'black']),
    handler: ({ script }) => sideFromScript(script),
  })
  .bridge('game')
  .method('opponentColor', {
    requires: 'game:read',
    input: z.object({}),
    output: z.enum(['white', 'black']),
    handler: ({ script }) => {
      const side = sideFromScript(script);
      return side === 'white' ? 'black' : 'white';
    },
  })
  .bridge('game')
  .method('result', {
    requires: 'game:read',
    input: z.object({}),
    output: z.string().nullable(),
    handler: ({ host }) => gameResult(host.chess) ?? null,
  })
  .bridge('game')
  .method('isMyTurn', {
    requires: 'game:read',
    input: z.object({}),
    output: z.boolean(),
    handler: ({ host, script }) => activeSide(host.chess) === sideFromScript(script),
  })
  .componentHooks(chessComponentHooks)
  .build();
