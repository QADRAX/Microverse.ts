import {
  formatExecutionFailure,
  MicroverseLua,
  luaGlobalHookName,
} from '@microverse.ts/microverse-lua';

import surface from './sortingSurface';
import {
  catalogEntryLabel,
  sortingScriptIds,
  type SortingScriptId,
} from './sortingScriptCatalog';
import { sortingScriptDefinition } from './sortingScriptRegistry';
import {
  createSortingLabHost,
  type SortingLabHost,
  type SortingSlotSide,
  type SortingVizSnapshot,
} from './sortingLabHost';

export type SortingLabEngineOptions = {
  readonly defaultTimeoutMs?: number | undefined;
};

export class SortingLabEngine {
  private readonly microverse;

  readonly host: SortingLabHost;

  constructor(options: SortingLabEngineOptions = {}) {
    this.host = createSortingLabHost();
    this.microverse = MicroverseLua.create({
      host: this.host,
      surface,
      defaultTimeoutMs: options.defaultTimeoutMs ?? 30_000,
    });
    for (const scriptId of sortingScriptIds) {
      this.microverse.registerScriptDefinition(sortingScriptDefinition(scriptId));
    }
  }

  readonly listAlgorithms = (): readonly { readonly id: SortingScriptId; readonly label: string }[] =>
    sortingScriptIds.map((id) => ({ id, label: catalogEntryLabel(id) }));

  readonly configure = async (args: {
    readonly algoA: SortingScriptId;
    readonly algoB: SortingScriptId;
    readonly values: readonly number[];
  }): Promise<void> => {
    await this.resetInstances();
    this.host.arrayA = [...args.values];
    this.host.arrayB = [...args.values];
    this.host.vizA = { values: [...args.values], highlights: [], sortedPrefix: 0, done: false };
    this.host.vizB = { values: [...args.values], highlights: [], sortedPrefix: 0, done: false };
    this.host.stepIndex = 0;

    await this.mountSide('A', args.algoA);
    await this.mountSide('B', args.algoB);
  };

  private readonly mountSide = async (side: SortingSlotSide, scriptId: SortingScriptId): Promise<void> => {
    await this.microverse.mountScriptInstance({
      instanceId: side,
      scriptId,
      profileId: 'SortingAlgorithm',
      profileSingleton: 'SortingAlgorithm',
      props: {
        label: catalogEntryLabel(scriptId),
        slotSide: side,
      },
    });
  };

  readonly tickInstance = async (side: SortingSlotSide): Promise<void> => {
    const session = this.microverse.getInstance(side);
    if (session === undefined) {
      return;
    }
    this.host.stepIndex += 1;
    const step = this.host.stepIndex;
    const result = await session.invokeComponentHook(luaGlobalHookName('Tick'), { step });
    if (result._tag !== 'ok') {
      throw new Error(`Tick failed for ${side}: ${formatExecutionFailure(result.error)}`);
    }
  };

  readonly stepBoth = async (): Promise<void> => {
    await this.tickInstance('A');
    await this.tickInstance('B');
  };

  readonly getSnapshot = (side: SortingSlotSide): SortingVizSnapshot => {
    return side === 'A' ? this.host.vizA : this.host.vizB;
  };

  readonly bothDone = (): boolean => this.host.vizA.done && this.host.vizB.done;

  readonly resetInstances = async (): Promise<void> => {
    for (const side of ['A', 'B'] as const) {
      if (this.microverse.getInstance(side) !== undefined) {
        await this.microverse.unmountScriptInstance(side);
      }
    }
  };

  readonly dispose = async (): Promise<void> => {
    await this.microverse.dispose();
  };
}
