import type { ChessBoardSnapshot, ChessMoveHighlight } from '../engine/chessLabHost';

const PIECE_UNICODE: Record<string, string> = {
  wp: '♙',
  wn: '♘',
  wb: '♗',
  wr: '♖',
  wq: '♕',
  wk: '♔',
  bp: '♟',
  bn: '♞',
  bb: '♝',
  br: '♜',
  bq: '♛',
  bk: '♚',
};

export type RenderBoardOptions = {
  /** Duration of the slide animation when a new lastMove is present (0 = instant). */
  readonly animationMs?: number;
};

type SquareIndex = { readonly file: number; readonly rank: number };

type ActiveAnimation = {
  readonly fenBefore: string;
  readonly fenAfter: string;
  readonly highlights: readonly string[];
  readonly from: SquareIndex;
  readonly to: SquareIndex;
  readonly fromName: string;
  readonly toName: string;
  readonly piece: string;
  readonly startMs: number;
  readonly durationMs: number;
};

function parseBoardFromFen(fen: string): (string | null)[][] {
  const placement = fen.split(' ')[0] ?? '';
  const rows = placement.split('/');
  return rows.map((row) => {
    const squares: (string | null)[] = [];
    for (const ch of row) {
      if (ch >= '1' && ch <= '8') {
        const n = Number(ch);
        for (let i = 0; i < n; i += 1) {
          squares.push(null);
        }
      } else {
        const color = ch === ch.toUpperCase() ? 'w' : 'b';
        squares.push(`${color}${ch.toLowerCase()}`);
      }
    }
    return squares;
  });
}

function parseSquare(square: string): SquareIndex {
  return {
    file: square.charCodeAt(0) - 97,
    rank: 8 - Number(square[1]),
  };
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function moveAnimationMs(playDelayMs: number): number {
  if (playDelayMs <= 0) {
    return 280;
  }
  return Math.min(Math.max(Math.round(playDelayMs * 0.75), 120), 600);
}

function squareName(file: number, rank: number): string {
  return `${String.fromCharCode(97 + file)}${8 - rank}`;
}

function drawPiece(
  ctx: CanvasRenderingContext2D,
  piece: string,
  cx: number,
  cy: number,
  squarePx: number,
): void {
  ctx.font = `${squarePx * 0.72}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = piece.startsWith('w') ? '#f8fafc' : '#0f1117';
  ctx.strokeStyle = piece.startsWith('w') ? '#0f1117' : '#f8fafc';
  ctx.lineWidth = 1.5;
  const glyph = PIECE_UNICODE[piece] ?? '?';
  ctx.strokeText(glyph, cx, cy + 2);
  ctx.fillText(glyph, cx, cy + 2);
}

function drawBoardFrame(
  ctx: CanvasRenderingContext2D,
  grid: (string | null)[][],
  squarePx: number,
  highlights: ReadonlySet<string>,
  skipSquares: ReadonlySet<string>,
): void {
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const x = file * squarePx;
      const y = rank * squarePx;
      const light = (rank + file) % 2 === 0;
      ctx.fillStyle = light ? '#e8edf5' : '#7c8aa5';
      ctx.fillRect(x, y, squarePx, squarePx);

      const name = squareName(file, rank);
      if (highlights.has(name)) {
        ctx.fillStyle = 'rgba(110, 231, 183, 0.45)';
        ctx.fillRect(x, y, squarePx, squarePx);
      }

      if (skipSquares.has(name)) {
        continue;
      }

      const piece = grid[rank]?.[file];
      if (piece !== null && piece !== undefined) {
        drawPiece(ctx, piece, x + squarePx / 2, y + squarePx / 2, squarePx);
      }
    }
  }
}

function pieceAtSquare(fen: string, square: string): string | undefined {
  const { file, rank } = parseSquare(square);
  const piece = parseBoardFromFen(fen)[rank]?.[file];
  return piece ?? undefined;
}

function drawStatic(
  ctx: CanvasRenderingContext2D,
  snapshot: ChessBoardSnapshot,
  squarePx: number,
): void {
  const grid = parseBoardFromFen(snapshot.fen);
  drawBoardFrame(ctx, grid, squarePx, new Set(snapshot.highlights), new Set());
}

function shouldAnimateMove(prev: ChessMoveHighlight | undefined, next: ChessMoveHighlight | undefined): boolean {
  if (next === undefined) {
    return false;
  }
  if (prev === undefined) {
    return true;
  }
  return prev.from !== next.from || prev.to !== next.to || prev.san !== next.san;
}

export function createBoardRenderer(canvas: HTMLCanvasElement) {
  let rafId: number | undefined;
  let animation: ActiveAnimation | undefined;
  let previousLastMove: ChessMoveHighlight | undefined;
  let lastFen: string | undefined;

  const cancelAnimation = (): void => {
    if (rafId !== undefined) {
      cancelAnimationFrame(rafId);
      rafId = undefined;
    }
    animation = undefined;
  };

  const paintAnimationFrame = (now: number): void => {
    if (animation === undefined) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
      return;
    }

    const squarePx = canvas.width / 8;
    const elapsed = now - animation.startMs;
    const rawT = Math.min(1, elapsed / animation.durationMs);
    const t = easeOutCubic(rawT);

    const grid = parseBoardFromFen(animation.fenBefore);
    const hidden = new Set([animation.fromName, animation.toName]);
    drawBoardFrame(ctx, grid, squarePx, new Set(animation.highlights), hidden);

    const fromCx = animation.from.file * squarePx + squarePx / 2;
    const fromCy = animation.from.rank * squarePx + squarePx / 2;
    const toCx = animation.to.file * squarePx + squarePx / 2;
    const toCy = animation.to.rank * squarePx + squarePx / 2;
    const cx = fromCx + (toCx - fromCx) * t;
    const cy = fromCy + (toCy - fromCy) * t;
    drawPiece(ctx, animation.piece, cx, cy, squarePx);

    if (rawT < 1) {
      rafId = requestAnimationFrame(paintAnimationFrame);
      return;
    }

    const done: ChessBoardSnapshot = {
      fen: animation.fenAfter,
      turn: 'white',
      ply: 0,
      positionRepeats: 1,
      highlights: animation.highlights,
      gameOver: false,
    };
    animation = undefined;
    rafId = undefined;
    drawStatic(ctx, done, squarePx);
  };

  const startAnimation = (
    snapshot: ChessBoardSnapshot,
    fenBefore: string,
    durationMs: number,
  ): void => {
    const move = snapshot.lastMove;
    if (move === undefined) {
      return;
    }
    const piece =
      pieceAtSquare(fenBefore, move.from) ?? pieceAtSquare(snapshot.fen, move.to);
    if (piece === undefined) {
      return;
    }

    const from = parseSquare(move.from);
    const to = parseSquare(move.to);

    cancelAnimation();
    animation = {
      fenBefore,
      fenAfter: snapshot.fen,
      highlights: snapshot.highlights,
      from,
      to,
      fromName: move.from,
      toName: move.to,
      piece,
      startMs: performance.now(),
      durationMs,
    };
    rafId = requestAnimationFrame(paintAnimationFrame);
  };

  const render = (snapshot: ChessBoardSnapshot, options: RenderBoardOptions = {}): void => {
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
      return;
    }

    const animationMs = options.animationMs ?? 0;
    const move = snapshot.lastMove;

    if (snapshot.ply === 0) {
      previousLastMove = undefined;
      lastFen = snapshot.fen;
      cancelAnimation();
      drawStatic(ctx, snapshot, canvas.width / 8);
      return;
    }

    const fenBefore = lastFen ?? snapshot.fen;

    if (animationMs > 0 && move !== undefined && shouldAnimateMove(previousLastMove, move)) {
      previousLastMove = move;
      startAnimation(snapshot, fenBefore, animationMs);
      lastFen = snapshot.fen;
      return;
    }

    previousLastMove = move;
    lastFen = snapshot.fen;
    cancelAnimation();
    drawStatic(ctx, snapshot, canvas.width / 8);
  };

  return { render, cancelAnimation };
}

/** Immediate draw (used in tests). */
export function renderBoard(
  canvas: HTMLCanvasElement,
  snapshot: ChessBoardSnapshot,
  options: RenderBoardOptions = {},
): void {
  createBoardRenderer(canvas).render(snapshot, options);
}
