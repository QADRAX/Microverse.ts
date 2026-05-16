import { SORTING_ALGORITHM_PROFILE } from './sortingAlgorithmProfile';

export const SORTING_PROFILE_ID = 'SortingAlgorithm' as const;

export const sortingScriptCatalog = {
  bubble_sort: {
    label: 'Bubble sort',
    profile: SORTING_ALGORITHM_PROFILE,
  },
  insertion_sort: {
    label: 'Insertion sort',
    profile: SORTING_ALGORITHM_PROFILE,
  },
  selection_sort: {
    label: 'Selection sort',
    profile: SORTING_ALGORITHM_PROFILE,
  },
  quick_sort: {
    label: 'Quick sort (didactic)',
    profile: SORTING_ALGORITHM_PROFILE,
  },
} as const;

export type SortingScriptId = keyof typeof sortingScriptCatalog;

export const sortingScriptIds = Object.keys(sortingScriptCatalog) as SortingScriptId[];

export function catalogEntryLabel(scriptId: SortingScriptId): string {
  return sortingScriptCatalog[scriptId].label;
}
