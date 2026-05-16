import {
  sortingLuaScriptPath,
  sortingLuaSource,
} from '../engine/sortingLuaBundle';
import type { SortingSlotSide } from '../engine/sortingLabHost';
import type { SortingScriptId } from '../engine/sortingScriptCatalog';
import { instanceMetaLine, instancePanelTitle, instanceScriptNote } from './sortingLabCopy';

export function updatePanelInstanceUi(
  side: SortingSlotSide,
  elements: {
    readonly title: HTMLElement;
    readonly meta: HTMLElement;
    readonly note: HTMLElement;
    readonly path: HTMLElement;
    readonly source: HTMLElement;
  },
  scriptId: SortingScriptId,
  algorithmLabel: string,
): void {
  elements.title.textContent = instancePanelTitle(side, algorithmLabel);
  elements.meta.textContent = instanceMetaLine(side);
  elements.note.textContent = instanceScriptNote(side);
  elements.path.textContent = sortingLuaScriptPath(scriptId);
  elements.source.textContent = sortingLuaSource(scriptId);
}
