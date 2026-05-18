import type { SortingSlotSide } from '../engine/sortingLabHost';

export const SORTING_LAB_RUNTIME_SUMMARY =
  'One MicroverseLua Wasm sandbox (wasmoon). Two mounted script instances run side by side with the same SortingAlgorithm profile.';

export function instancePanelTitle(side: SortingSlotSide, algorithmLabel: string): string {
  return `Instance ${side} — ${algorithmLabel}`;
}

export function instanceMetaLine(side: SortingSlotSide): string {
  return `instanceId "${side}" · profile SortingAlgorithm · hook onTick · bridges array, viz, sort`;
}

export function instanceScriptNote(side: SortingSlotSide): string {
  return `Mounted in the shared microverse. Play / Step invokes onTick on instance ${side}; this Lua component sorts via self.bridges—not TypeScript.`;
}
