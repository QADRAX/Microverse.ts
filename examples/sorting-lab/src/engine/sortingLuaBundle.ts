import bubbleSort from '../../lua/bubble_sort.lua?raw';
import insertionSort from '../../lua/insertion_sort.lua?raw';
import quickSort from '../../lua/quick_sort.lua?raw';
import selectionSort from '../../lua/selection_sort.lua?raw';

import type { SortingScriptId } from './sortingScriptCatalog';

export const sortingLuaSources: Record<SortingScriptId, string> = {
  bubble_sort: bubbleSort,
  insertion_sort: insertionSort,
  selection_sort: selectionSort,
  quick_sort: quickSort,
};
