import type { ScriptInstanceContext } from '@microverse.ts/microverse-lua';
import type { TaggedLuaMicroverseHost } from '@microverse.ts/microverse-lua';

import type { SortingComponentHooksSpec } from './sortingHooks';

export type SortingSlotSide = 'A' | 'B';

export type SortingVizSnapshot = {
  readonly values: readonly number[];
  readonly highlights: readonly number[];
  readonly comparing?: readonly [number, number];
  readonly sortedPrefix: number;
  readonly message?: string;
  readonly done: boolean;
};

export type SortingLabHostState = {
  arrayA: number[];
  arrayB: number[];
  vizA: SortingVizSnapshot;
  vizB: SortingVizSnapshot;
  stepIndex: number;
};

export type SortingLabHost = TaggedLuaMicroverseHost<
  SortingComponentHooksSpec,
  SortingLabHostState
>;

export function sideFromScript(script: ScriptInstanceContext): SortingSlotSide {
  if (script.instanceId === 'B') {
    return 'B';
  }
  return 'A';
}

export function arrayForSide(host: SortingLabHostState, side: SortingSlotSide): number[] {
  return side === 'A' ? host.arrayA : host.arrayB;
}

export function vizForSide(host: SortingLabHostState, side: SortingSlotSide): SortingVizSnapshot {
  return side === 'A' ? host.vizA : host.vizB;
}

export function syncVizValues(host: SortingLabHostState, side: SortingSlotSide): void {
  const arr = arrayForSide(host, side);
  const viz = vizForSide(host, side);
  const next: SortingVizSnapshot = { ...viz, values: [...arr] };
  if (side === 'A') {
    host.vizA = next;
  } else {
    host.vizB = next;
  }
}

const emptyViz = (): SortingVizSnapshot => ({
  values: [],
  highlights: [],
  sortedPrefix: 0,
  done: false,
});

export function createSortingLabHost(): SortingLabHost {
  return {
    arrayA: [],
    arrayB: [],
    vizA: emptyViz(),
    vizB: emptyViz(),
    stepIndex: 0,
  };
}
