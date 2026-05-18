import { ChessLabEngine } from './engine/chessLabEngine';
import type { ChessBoardSnapshot } from './engine/chessLabHost';
import {
  catalogEntryDescription,
  catalogEntryLabel,
  chessScriptIds,
  type ChessScriptId,
} from './engine/chessScriptCatalog';

export type ChessLabControllerOptions = {
  readonly onBoard?: (snapshot: ChessBoardSnapshot) => void;
  readonly onStepIndex?: (step: number) => void;
  /** Milliseconds to wait between moves in play mode (default 600). */
  readonly playDelayMs?: number | undefined;
};

const MIN_PLAY_DELAY_MS = 0;
const MAX_PLAY_DELAY_MS = 10_000;
const DEFAULT_PLAY_DELAY_MS = 600;

export function clampPlayDelayMs(ms: number): number {
  if (!Number.isFinite(ms)) {
    return DEFAULT_PLAY_DELAY_MS;
  }
  return Math.max(MIN_PLAY_DELAY_MS, Math.min(MAX_PLAY_DELAY_MS, Math.round(ms)));
}

export class ChessLabController {
  private readonly engine = new ChessLabEngine();

  private playing = false;

  private playTimeoutId: ReturnType<typeof setTimeout> | undefined;

  private playDelayMs: number;

  private engineWhite: ChessScriptId = 'random_move';

  private engineBlack: ChessScriptId = 'greedy_material';

  constructor(private readonly options: ChessLabControllerOptions = {}) {
    this.playDelayMs = clampPlayDelayMs(options.playDelayMs ?? DEFAULT_PLAY_DELAY_MS);
  }

  readonly getPlayDelayMs = (): number => this.playDelayMs;

  readonly setPlayDelayMs = (ms: number): void => {
    this.playDelayMs = clampPlayDelayMs(ms);
  };

  readonly listEngines = (): readonly {
    readonly id: ChessScriptId;
    readonly label: string;
    readonly description: string;
  }[] =>
    chessScriptIds.map((id) => ({
      id,
      label: catalogEntryLabel(id),
      description: catalogEntryDescription(id),
    }));

  readonly configure = async (args: {
    readonly engineWhite: ChessScriptId;
    readonly engineBlack: ChessScriptId;
    readonly fen?: string | undefined;
  }): Promise<void> => {
    this.engineWhite = args.engineWhite;
    this.engineBlack = args.engineBlack;
    await this.engine.configure(args);
    this.emitBoard();
  };

  readonly step = async (): Promise<void> => {
    if (this.engine.isGameOver()) {
      this.pause();
      return;
    }
    await this.engine.step();
    this.options.onStepIndex?.(this.engine.host.stepIndex);
    this.emitBoard();
    if (this.engine.isGameOver()) {
      this.pause();
    }
  };

  readonly play = (): void => {
    if (this.playing) {
      return;
    }
    this.playing = true;
    const loop = async (): Promise<void> => {
      if (!this.playing) {
        return;
      }
      await this.step();
      if (!this.playing || this.engine.isGameOver()) {
        this.playing = false;
        return;
      }
      const delay = this.playDelayMs;
      this.playTimeoutId = setTimeout(() => {
        this.playTimeoutId = undefined;
        void loop();
      }, delay);
    };
    void loop();
  };

  readonly pause = (): void => {
    this.playing = false;
    if (this.playTimeoutId !== undefined) {
      clearTimeout(this.playTimeoutId);
      this.playTimeoutId = undefined;
    }
  };

  readonly reset = async (fen?: string): Promise<void> => {
    this.pause();
    await this.engine.configure({
      engineWhite: this.engineWhite,
      engineBlack: this.engineBlack,
      fen,
    });
    this.options.onStepIndex?.(0);
    this.emitBoard();
  };

  readonly getBoardSnapshot = (): ChessBoardSnapshot => this.engine.getBoardSnapshot();

  readonly isGameOver = (): boolean => this.engine.isGameOver();

  readonly dispose = async (): Promise<void> => {
    this.pause();
    await this.engine.dispose();
  };

  private readonly emitBoard = (): void => {
    this.options.onBoard?.(this.engine.getBoardSnapshot());
  };
}
