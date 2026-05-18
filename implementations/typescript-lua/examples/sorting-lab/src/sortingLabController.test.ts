import { describe, expect, it } from 'vitest';

import { SortingLabController, seededValues } from './sortingLabController';

describe('SortingLabController', () => {
  it('sorts both panels for bubble vs insertion on a small array', async () => {
    const controller = new SortingLabController();
    const values = seededValues(8, 7);
    await controller.configure({
      algoA: 'bubble_sort',
      algoB: 'insertion_sort',
      values,
    });

    const maxSteps = values.length * values.length * 8;
    for (let i = 0; i < maxSteps && !controller.bothDone(); i += 1) {
      await controller.step();
    }
    expect(controller.bothDone()).toBe(true);

    const snapA = controller.getSnapshot('A');
    const snapB = controller.getSnapshot('B');
    const sorted = [...values].sort((a, b) => a - b);
    expect([...snapA.values]).toEqual(sorted);
    expect([...snapB.values]).toEqual(sorted);
    expect(snapA.done).toBe(true);
    expect(snapB.done).toBe(true);

    await controller.dispose();
  }, 60_000);

  it('quick_sort completes on a small array', async () => {
    const controller = new SortingLabController();
    const values = seededValues(12, 99);
    await controller.configure({
      algoA: 'quick_sort',
      algoB: 'bubble_sort',
      values,
    });

    const maxSteps = values.length * values.length * 12;
    for (let step = 0; step < maxSteps && !controller.bothDone(); step += 1) {
      await controller.step();
    }

    expect(controller.bothDone()).toBe(true);
    const sorted = [...values].sort((a, b) => a - b);
    expect([...controller.getSnapshot('A').values]).toEqual(sorted);

    await controller.dispose();
  }, 60_000);

  it.each([
    'shell_sort',
    'heap_sort',
    'merge_sort',
    'cocktail_sort',
    'comb_sort',
    'gnome_sort',
    'odd_even_sort',
  ] as const)('%s completes on a small array', async (algo) => {
    const controller = new SortingLabController();
    const values = seededValues(10, 42);
    await controller.configure({
      algoA: algo,
      algoB: 'bubble_sort',
      values,
    });

    const maxSteps = values.length * values.length * 20;
    for (let step = 0; step < maxSteps && !controller.getSnapshot('A').done; step += 1) {
      await controller.step();
    }

    expect(controller.getSnapshot('A').done).toBe(true);
    const sorted = [...values].sort((a, b) => a - b);
    expect([...controller.getSnapshot('A').values]).toEqual(sorted);

    await controller.dispose();
  }, 60_000);
});
