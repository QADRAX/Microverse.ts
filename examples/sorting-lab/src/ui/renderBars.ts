import type { SortingVizSnapshot } from '../engine/sortingLabHost';

export function renderBars(container: HTMLElement, snapshot: SortingVizSnapshot): void {
  container.replaceChildren();
  const max = Math.max(1, ...snapshot.values);
  const compareSet = new Set(snapshot.comparing ?? []);
  const highlightSet = new Set(snapshot.highlights);

  snapshot.values.forEach((value, index) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = `${Math.round((value / max) * 100)}%`;
    bar.title = String(value);
    if (snapshot.done) {
      bar.classList.add('done');
    }
    if (index < snapshot.sortedPrefix) {
      bar.classList.add('sorted');
    }
    if (compareSet.has(index)) {
      bar.classList.add('compare');
    }
    if (highlightSet.has(index)) {
      bar.classList.add('highlight');
    }
    container.appendChild(bar);
  });
}
