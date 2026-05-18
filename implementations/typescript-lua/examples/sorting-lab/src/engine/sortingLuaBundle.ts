import bubbleSort from '../../lua/bubble_sort.lua?raw';
import cocktailSort from '../../lua/cocktail_sort.lua?raw';
import combSort from '../../lua/comb_sort.lua?raw';
import gnomeSort from '../../lua/gnome_sort.lua?raw';
import heapSort from '../../lua/heap_sort.lua?raw';
import insertionSort from '../../lua/insertion_sort.lua?raw';
import mergeSort from '../../lua/merge_sort.lua?raw';
import oddEvenSort from '../../lua/odd_even_sort.lua?raw';
import quickSort from '../../lua/quick_sort.lua?raw';
import selectionSort from '../../lua/selection_sort.lua?raw';
import shellSort from '../../lua/shell_sort.lua?raw';

import type { SortingScriptId } from './sortingScriptCatalog';

export const sortingLuaSources: Record<SortingScriptId, string> = {
  bubble_sort: bubbleSort,
  cocktail_sort: cocktailSort,
  comb_sort: combSort,
  gnome_sort: gnomeSort,
  heap_sort: heapSort,
  insertion_sort: insertionSort,
  merge_sort: mergeSort,
  odd_even_sort: oddEvenSort,
  quick_sort: quickSort,
  selection_sort: selectionSort,
  shell_sort: shellSort,
};

export function sortingLuaScriptPath(scriptId: SortingScriptId): string {
  return `lua/${scriptId}.lua`;
}

export function sortingLuaSource(scriptId: SortingScriptId): string {
  return sortingLuaSources[scriptId];
}
