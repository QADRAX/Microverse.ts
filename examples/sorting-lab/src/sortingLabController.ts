import { SortingLabEngine } from './engine/sortingLabEngine';
import type { SortingScriptId } from './engine/sortingScriptCatalog';
import type { SortingSlotSide, SortingVizSnapshot } from './engine/sortingLabHost';

export type SortingLabControllerOptions = {
  readonly onSnapshot?: (side: SortingSlotSide, snapshot: SortingVizSnapshot) => void;
  readonly onStepIndex?: (step: number) => void;
};

export function seededValues(n: number, seed: number): number[] {
  let s = seed >>> 0;
  const out: number[] = [];
  for (let i = 0; i < n; i += 1) {
    s = (s * 1664525 + 1013904223) >>> 0;
    out.push(1 + (s % n));
  }
  return out;
}

export class SortingLabController {
  private readonly engine = new SortingLabEngine();

  private playing = false;

  private rafId: number | undefined;

  private algoA: SortingScriptId = 'bubble_sort';

  private algoB: SortingScriptId = 'insertion_sort';

  constructor(private readonly options: SortingLabControllerOptions = {}) {}

  readonly listAlgorithms = () => this.engine.listAlgorithms();

  readonly configure = async (args: {
    readonly algoA: SortingScriptId;
    readonly algoB: SortingScriptId;
    readonly values: readonly number[];
  }): Promise<void> => {
    this.algoA = args.algoA;
    this.algoB = args.algoB;
    await this.engine.configure(args);
    this.emitSnapshots();
  };

  readonly step = async (): Promise<void> => {
    if (this.engine.bothDone()) {
      this.pause();
      return;
    }
    await this.engine.stepBoth();
    this.options.onStepIndex?.(this.engine.host.stepIndex);
    this.emitSnapshots();
    if (this.engine.bothDone()) {
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
      if (!this.playing || this.engine.bothDone()) {
        this.playing = false;
        return;
      }
      this.rafId = requestAnimationFrame(() => {
        void loop();
      });
    };
    void loop();
  };

  readonly pause = (): void => {
    this.playing = false;
    if (this.rafId !== undefined) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
  };

  readonly reset = async (values: readonly number[]): Promise<void> => {
    this.pause();
    await this.engine.configure({
      algoA: this.algoA,
      algoB: this.algoB,
      values,
    });
    this.options.onStepIndex?.(0);
    this.emitSnapshots();
  };

  readonly getSnapshot = (side: SortingSlotSide) => this.engine.getSnapshot(side);

  readonly bothDone = (): boolean => this.engine.bothDone();

  readonly dispose = async (): Promise<void> => {
    this.pause();
    await this.engine.dispose();
  };

  private readonly emitSnapshots = (): void => {
    this.options.onSnapshot?.('A', this.engine.getSnapshot('A'));
    this.options.onSnapshot?.('B', this.engine.getSnapshot('B'));
  };
}
