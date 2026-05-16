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
  shell_sort: {
    label: 'Shell sort',
    profile: SORTING_ALGORITHM_PROFILE,
  },
  heap_sort: {
    label: 'Heap sort',
    profile: SORTING_ALGORITHM_PROFILE,
  },
  merge_sort: {
    label: 'Merge sort (bottom-up)',
    profile: SORTING_ALGORITHM_PROFILE,
  },
  cocktail_sort: {
    label: 'Cocktail sort',
    profile: SORTING_ALGORITHM_PROFILE,
  },
  comb_sort: {
    label: 'Comb sort',
    profile: SORTING_ALGORITHM_PROFILE,
  },
  gnome_sort: {
    label: 'Gnome sort',
    profile: SORTING_ALGORITHM_PROFILE,
  },
  odd_even_sort: {
    label: 'Odd-even sort',
    profile: SORTING_ALGORITHM_PROFILE,
  },
} as const;

export type SortingScriptId = keyof typeof sortingScriptCatalog;

export const sortingScriptIds = Object.keys(sortingScriptCatalog) as SortingScriptId[];

export function catalogEntryLabel(scriptId: SortingScriptId): string {
  return sortingScriptCatalog[scriptId].label;
}
