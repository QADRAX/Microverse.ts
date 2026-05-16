import { SortingLabController, seededValues } from './sortingLabController';
import type { SortingScriptId } from './engine/sortingScriptCatalog';
import { renderBars } from './ui/renderBars';
import { updatePanelInstanceUi } from './ui/updatePanelLuaScript';

const algoASelect = document.querySelector<HTMLSelectElement>('#algoA')!;
const algoBSelect = document.querySelector<HTMLSelectElement>('#algoB')!;
const sizeInput = document.querySelector<HTMLInputElement>('#sizeN')!;
const seedInput = document.querySelector<HTMLInputElement>('#seed')!;
const panelA = document.querySelector<HTMLElement>('#panelA')!;
const panelB = document.querySelector<HTMLElement>('#panelB')!;
const messageA = document.querySelector<HTMLElement>('#messageA')!;
const messageB = document.querySelector<HTMLElement>('#messageB')!;
const titleA = document.querySelector<HTMLElement>('#titleA')!;
const titleB = document.querySelector<HTMLElement>('#titleB')!;
const metaA = document.querySelector<HTMLElement>('#metaA')!;
const metaB = document.querySelector<HTMLElement>('#metaB')!;
const noteA = document.querySelector<HTMLElement>('#noteA')!;
const noteB = document.querySelector<HTMLElement>('#noteB')!;
const pathA = document.querySelector<HTMLElement>('#pathA')!;
const pathB = document.querySelector<HTMLElement>('#pathB')!;
const luaSourceA = document.querySelector<HTMLElement>('#luaSourceA code')!;
const luaSourceB = document.querySelector<HTMLElement>('#luaSourceB code')!;
const stepLabel = document.querySelector<HTMLElement>('#stepLabel')!;

const controller = new SortingLabController({
  onSnapshot(side, snapshot) {
    const panel = side === 'A' ? panelA : panelB;
    const message = side === 'A' ? messageA : messageB;
    renderBars(panel, snapshot);
    message.textContent = snapshot.message ?? (snapshot.done ? 'Sorted' : '');
  },
  onStepIndex(step) {
    stepLabel.textContent = `Step ${step}`;
  },
});

function fillAlgorithmSelects(): void {
  for (const { id, label } of controller.listAlgorithms()) {
    for (const select of [algoASelect, algoBSelect]) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = label;
      select.appendChild(opt);
    }
  }
  algoASelect.value = 'bubble_sort';
  algoBSelect.value = 'insertion_sort';
}

function currentValues(): number[] {
  const n = Math.max(3, Math.min(64, Number(sizeInput.value) || 16));
  const seed = Number(seedInput.value) || 42;
  return seededValues(n, seed);
}

async function applyConfiguration(): Promise<void> {
  const values = currentValues();
  const algoA = algoASelect.value as SortingScriptId;
  const algoB = algoBSelect.value as SortingScriptId;
  const labelA = algoASelect.selectedOptions[0]?.textContent ?? '';
  const labelB = algoBSelect.selectedOptions[0]?.textContent ?? '';
  updatePanelInstanceUi(
    'A',
    { title: titleA, meta: metaA, note: noteA, path: pathA, source: luaSourceA },
    algoA,
    labelA,
  );
  updatePanelInstanceUi(
    'B',
    { title: titleB, meta: metaB, note: noteB, path: pathB, source: luaSourceB },
    algoB,
    labelB,
  );
  await controller.configure({
    algoA,
    algoB,
    values,
  });
}

fillAlgorithmSelects();

const status = document.querySelector<HTMLElement>('#boot-status');
if (status) {
  status.remove();
}

void applyConfiguration().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  document.body.insertAdjacentHTML(
    'beforeend',
    `<p class="boot-error">Failed to start Wasm Lua: ${message}</p>`,
  );
});

document.querySelector('#play')?.addEventListener('click', () => controller.play());
document.querySelector('#pause')?.addEventListener('click', () => controller.pause());
document.querySelector('#step')?.addEventListener('click', () => {
  void controller.step();
});
document.querySelector('#reset')?.addEventListener('click', () => {
  void controller.reset(currentValues());
});
document.querySelector('#shuffle')?.addEventListener('click', () => {
  seedInput.value = String(Math.floor(Math.random() * 1_000_000));
  void applyConfiguration();
});
for (const select of [algoASelect, algoBSelect]) {
  select.addEventListener('change', () => {
    void applyConfiguration();
  });
}
