import { chessLuaScriptPath, chessLuaSource } from '../engine/chessLuaBundle';
import type { ChessInstanceSide } from '../engine/chessLabHost';
import { catalogEntryDescription, type ChessScriptId } from '../engine/chessScriptCatalog';
import { instanceMetaLine, instancePanelTitle, instanceScriptNote } from './chessLabCopy';

export type PanelElements = {
  readonly title: HTMLElement;
  readonly meta: HTMLElement;
  readonly description: HTMLElement;
  readonly note: HTMLElement;
  readonly path: HTMLElement;
  readonly source: HTMLElement;
};

export function updatePanelInstanceUi(
  side: ChessInstanceSide,
  elements: PanelElements,
  scriptId: ChessScriptId,
  engineLabel: string,
): void {
  elements.title.textContent = instancePanelTitle(side, engineLabel);
  elements.meta.textContent = instanceMetaLine(side);
  elements.description.textContent = catalogEntryDescription(scriptId);
  elements.note.textContent = instanceScriptNote(side);
  elements.path.textContent = chessLuaScriptPath(scriptId);
  elements.source.textContent = chessLuaSource(scriptId);
}
