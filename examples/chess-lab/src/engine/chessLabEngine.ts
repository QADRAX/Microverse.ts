import {
  formatExecutionFailure,
  MicroverseLua,
  luaGlobalHookName,
} from '@microverse.ts/microverse-lua';

import surface from './chessSurface';
import {
  catalogEntryLabel,
  chessScriptIds,
  type ChessScriptId,
} from './chessScriptCatalog';
import { chessScriptDefinition } from './chessScriptRegistry';
import {
  createChessLabHost,
  resetChessHost,
  type ChessBoardSnapshot,
  type ChessInstanceSide,
  type ChessLabHost,
} from './chessLabHost';
import { START_FEN, activeSide, createGame, gameResult, positionRepetitionCount } from './chessRules';

export type ChessLabEngineOptions = {
  readonly defaultTimeoutMs?: number | undefined;
};

export class ChessLabEngine {
  private readonly microverse;

  readonly host: ChessLabHost;

  constructor(options: ChessLabEngineOptions = {}) {
    this.host = createChessLabHost(createGame());
    this.microverse = MicroverseLua.create({
      host: this.host,
      surface,
      defaultTimeoutMs: options.defaultTimeoutMs ?? 30_000,
    });
    for (const scriptId of chessScriptIds) {
      this.microverse.registerScriptDefinition(chessScriptDefinition(scriptId));
    }
  }

  readonly listEngines = (): readonly { readonly id: ChessScriptId; readonly label: string }[] =>
    chessScriptIds.map((id) => ({ id, label: catalogEntryLabel(id) }));

  readonly configure = async (args: {
    readonly engineWhite: ChessScriptId;
    readonly engineBlack: ChessScriptId;
    readonly fen?: string | undefined;
  }): Promise<void> => {
    await this.resetInstances();
    resetChessHost(this.host, args.fen ?? START_FEN);
    this.syncBoardFromChess();

    await this.mountSide('white', args.engineWhite);
    await this.mountSide('black', args.engineBlack);
  };

  private readonly mountSide = async (
    side: ChessInstanceSide,
    scriptId: ChessScriptId,
  ): Promise<void> => {
    await this.microverse.mountScriptInstance({
      instanceId: side,
      scriptId,
      profileId: 'ChessEngine',
      profileSingleton: 'ChessEngine',
      props: {
        label: catalogEntryLabel(scriptId),
        color: side,
      },
    });
  };

  readonly step = async (): Promise<void> => {
    if (this.host.chess.isGameOver()) {
      return;
    }
    const side = activeSide(this.host.chess);
    const session = this.microverse.getInstance(side);
    if (session === undefined) {
      return;
    }

    this.host.moveSubmittedThisStep = false;
    this.host.stepIndex += 1;
    const ply = this.host.ply;
    const lastMove = this.host.board.lastMove;
    const pickMoveEvent = {
      ply,
      positionRepeats: positionRepetitionCount(this.host.chess),
      ...(lastMove !== undefined ? { lastFrom: lastMove.from, lastTo: lastMove.to } : {}),
    };

    const result = await session.invokeComponentHook(luaGlobalHookName('PickMove'), pickMoveEvent);
    if (result._tag !== 'ok') {
      throw new Error(`PickMove failed for ${side}: ${formatExecutionFailure(result.error)}`);
    }

    if (!this.host.moveSubmittedThisStep) {
      const viz = side === 'white' ? this.host.vizWhite : this.host.vizBlack;
      const next = { ...viz, message: 'No move submitted' };
      if (side === 'white') {
        this.host.vizWhite = next;
      } else {
        this.host.vizBlack = next;
      }
    }

    const resultText = gameResult(this.host.chess);
    if (resultText !== undefined) {
      this.host.board = {
        ...this.host.board,
        gameOver: true,
        result: resultText,
        message: resultText,
      };
    }
    this.syncBoardFromChess();
  };

  readonly isGameOver = (): boolean => this.host.chess.isGameOver();

  readonly getBoardSnapshot = (): ChessBoardSnapshot => this.host.board;

  readonly resetInstances = async (): Promise<void> => {
    for (const side of ['white', 'black'] as const) {
      if (this.microverse.getInstance(side) !== undefined) {
        await this.microverse.unmountScriptInstance(side);
      }
    }
  };

  readonly dispose = async (): Promise<void> => {
    await this.microverse.dispose();
  };

  private readonly syncBoardFromChess = (): void => {
    const result = gameResult(this.host.chess);
    const prev = this.host.board;
    const gameOver = this.host.chess.isGameOver();
    const message =
      gameOver && result !== undefined ? result : (prev.message ?? result);
    this.host.board = {
      fen: this.host.chess.fen(),
      turn: activeSide(this.host.chess),
      ply: this.host.ply,
      positionRepeats: positionRepetitionCount(this.host.chess),
      highlights: [...prev.highlights],
      gameOver,
      ...(prev.lastMove !== undefined ? { lastMove: prev.lastMove } : {}),
      ...(result !== undefined ? { result } : {}),
      ...(message !== undefined ? { message } : {}),
    };
  };
}
