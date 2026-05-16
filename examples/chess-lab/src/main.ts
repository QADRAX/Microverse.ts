import { ChessLabController, clampPlayDelayMs } from './chessLabController';
import type { ChessScriptId } from './engine/chessScriptCatalog';
import { CHESS_LAB_RUNTIME_SUMMARY } from './ui/chessLabCopy';
import { createBoardRenderer, moveAnimationMs } from './ui/renderBoard';
import { updatePanelInstanceUi } from './ui/updatePanelLuaScript';

const engineWhiteSelect = document.querySelector<HTMLSelectElement>('#engineWhite')!;
const engineBlackSelect = document.querySelector<HTMLSelectElement>('#engineBlack')!;
const boardCanvas = document.querySelector<HTMLCanvasElement>('#board')!;
const stepLabel = document.querySelector<HTMLElement>('#stepLabel')!;
const turnLabel = document.querySelector<HTMLElement>('#turnLabel')!;
const resultLabel = document.querySelector<HTMLElement>('#resultLabel')!;
const statusLine = document.querySelector<HTMLElement>('#statusLine')!;
const messageWhite = document.querySelector<HTMLElement>('#messageWhite')!;
const messageBlack = document.querySelector<HTMLElement>('#messageBlack')!;
const runtimeSummary = document.querySelector<HTMLElement>('#runtimeSummary')!;
const playDelayInput = document.querySelector<HTMLInputElement>('#playDelayMs')!;

function syncPlayDelayFromUi(): void {
  controller.setPlayDelayMs(clampPlayDelayMs(Number(playDelayInput.value)));
}

const boardRenderer = createBoardRenderer(boardCanvas);

const controller = new ChessLabController({
  onBoard(snapshot) {
    boardRenderer.render(snapshot, {
      animationMs: moveAnimationMs(controller.getPlayDelayMs()),
    });
    stepLabel.textContent = `Ply ${snapshot.ply}`;
    turnLabel.textContent = snapshot.gameOver
      ? 'Game over'
      : `${snapshot.turn === 'white' ? 'White' : 'Black'} to move`;
    resultLabel.textContent = snapshot.result ?? '';
    const last = snapshot.lastMove;
    const rep =
      snapshot.positionRepeats >= 2
        ? ` · position ×${snapshot.positionRepeats}${snapshot.positionRepeats >= 3 ? ' (draw)' : ''}`
        : '';
    statusLine.textContent = last
      ? `Last: ${last.san} (${last.from}→${last.to})${rep}`
      : `${snapshot.fen.split(' ')[0] ?? ''}${rep}`;
  },
  onStepIndex(step) {
    stepLabel.textContent = `Step ${step}`;
  },
});

function fillEngineSelects(): void {
  for (const { id, label, description } of controller.listEngines()) {
    for (const select of [engineWhiteSelect, engineBlackSelect]) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = label;
      opt.title = description;
      select.appendChild(opt);
    }
  }
  engineWhiteSelect.value = 'random_move';
  engineBlackSelect.value = 'greedy_material';
}

async function applyConfiguration(): Promise<void> {
  const engineWhite = engineWhiteSelect.value as ChessScriptId;
  const engineBlack = engineBlackSelect.value as ChessScriptId;
  const labelWhite = engineWhiteSelect.selectedOptions[0]?.textContent ?? '';
  const labelBlack = engineBlackSelect.selectedOptions[0]?.textContent ?? '';

  updatePanelInstanceUi(
    'white',
    {
      title: document.querySelector('#titleWhite')!,
      meta: document.querySelector('#metaWhite')!,
      description: document.querySelector('#descWhite')!,
      note: document.querySelector('#noteWhite')!,
      path: document.querySelector('#pathWhite')!,
      source: document.querySelector('#luaSourceWhite code')!,
    },
    engineWhite,
    labelWhite,
  );
  updatePanelInstanceUi(
    'black',
    {
      title: document.querySelector('#titleBlack')!,
      meta: document.querySelector('#metaBlack')!,
      description: document.querySelector('#descBlack')!,
      note: document.querySelector('#noteBlack')!,
      path: document.querySelector('#pathBlack')!,
      source: document.querySelector('#luaSourceBlack code')!,
    },
    engineBlack,
    labelBlack,
  );

  await controller.configure({ engineWhite, engineBlack });
  messageWhite.textContent = '';
  messageBlack.textContent = '';
}

runtimeSummary.textContent = CHESS_LAB_RUNTIME_SUMMARY;

syncPlayDelayFromUi();
fillEngineSelects();

void applyConfiguration().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  document.body.insertAdjacentHTML(
    'beforeend',
    `<p class="boot-error">Failed to start Wasm Lua: ${message}</p>`,
  );
});

playDelayInput.addEventListener('change', syncPlayDelayFromUi);
playDelayInput.addEventListener('input', syncPlayDelayFromUi);

document.querySelector('#play')?.addEventListener('click', () => {
  syncPlayDelayFromUi();
  controller.play();
});
document.querySelector('#pause')?.addEventListener('click', () => controller.pause());
document.querySelector('#step')?.addEventListener('click', () => {
  void controller.step();
});
document.querySelector('#reset')?.addEventListener('click', () => {
  void controller.reset();
});
for (const select of [engineWhiteSelect, engineBlackSelect]) {
  select.addEventListener('change', () => {
    void applyConfiguration();
  });
}
