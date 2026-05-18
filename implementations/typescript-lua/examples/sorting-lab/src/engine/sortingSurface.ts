import { defineHostSurfaceFor } from '@microverse.ts/microverse-lua';
import { z } from 'zod';

import { SORTING_ALGORITHM_PROFILE } from './sortingAlgorithmProfile';
import {
  arrayForSide,
  sideFromScript,
  syncVizValues,
  vizForSide,
  type SortingLabHost,
} from './sortingLabHost';
import { sortingComponentHooks } from './sortingHooks';

export { sortingComponentHooks } from './sortingHooks';

export default defineHostSurfaceFor<SortingLabHost>()
  .componentType('SortingAlgorithm', SORTING_ALGORITHM_PROFILE)
  .bridge('array')
  .method('length', {
    requires: 'array:read',
    input: z.object({}),
    output: z.number().int().nonnegative(),
    handler: ({ host, script }) => arrayForSide(host, sideFromScript(script)).length,
  })
  .bridge('array')
  .method('get', {
    requires: 'array:read',
    input: z.object({ index: z.number().int().nonnegative() }),
    output: z.number().int(),
    handler: ({ host, script }, { index }) => {
      const arr = arrayForSide(host, sideFromScript(script));
      return arr[index] ?? 0;
    },
  })
  .bridge('array')
  .method('set', {
    requires: 'array:write',
    input: z.object({ index: z.number().int().nonnegative(), value: z.number().int() }),
    output: z.undefined(),
    handler: ({ host, script }, { index, value }) => {
      const side = sideFromScript(script);
      const arr = arrayForSide(host, side);
      arr[index] = value;
      syncVizValues(host, side);
      return undefined;
    },
  })
  .bridge('array')
  .method('swap', {
    requires: 'array:write',
    input: z.object({ a: z.number().int().nonnegative(), b: z.number().int().nonnegative() }),
    output: z.undefined(),
    handler: ({ host, script }, { a, b }) => {
      const side = sideFromScript(script);
      const arr = arrayForSide(host, side);
      const tmp = arr[a]!;
      arr[a] = arr[b]!;
      arr[b] = tmp;
      syncVizValues(host, side);
      return undefined;
    },
  })
  .bridge('array')
  .method('compare', {
    requires: 'array:read',
    input: z.object({ a: z.number().int().nonnegative(), b: z.number().int().nonnegative() }),
    output: z.number().int(),
    description: 'Returns -1, 0, or 1 comparing values at indices a and b.',
    handler: ({ host, script }, { a, b }) => {
      const arr = arrayForSide(host, sideFromScript(script));
      const va = arr[a] ?? 0;
      const vb = arr[b] ?? 0;
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
  })
  .bridge('viz')
  .method('highlight', {
    requires: 'viz:emit',
    input: z.object({ indices: z.array(z.number().int().nonnegative()) }),
    output: z.undefined(),
    handler: ({ host, script }, { indices }) => {
      const side = sideFromScript(script);
      const viz = vizForSide(host, side);
      const next = { ...viz, highlights: [...indices] };
      if (side === 'A') host.vizA = next;
      else host.vizB = next;
      return undefined;
    },
  })
  .bridge('viz')
  .method('markComparing', {
    requires: 'viz:emit',
    input: z.object({ a: z.number().int().nonnegative(), b: z.number().int().nonnegative() }),
    output: z.undefined(),
    handler: ({ host, script }, { a, b }) => {
      const side = sideFromScript(script);
      const viz = vizForSide(host, side);
      const next = { ...viz, comparing: [a, b] as [number, number], highlights: [a, b] };
      if (side === 'A') host.vizA = next;
      else host.vizB = next;
      return undefined;
    },
  })
  .bridge('viz')
  .method('markSortedPrefix', {
    requires: 'viz:emit',
    input: z.object({ count: z.number().int().nonnegative() }),
    output: z.undefined(),
    handler: ({ host, script }, { count }) => {
      const side = sideFromScript(script);
      const viz = vizForSide(host, side);
      const next = { ...viz, sortedPrefix: count };
      if (side === 'A') host.vizA = next;
      else host.vizB = next;
      return undefined;
    },
  })
  .bridge('viz')
  .method('note', {
    requires: 'viz:emit',
    input: z.object({ message: z.string() }),
    output: z.undefined(),
    handler: ({ host, script }, { message }) => {
      const side = sideFromScript(script);
      const viz = vizForSide(host, side);
      const next = { ...viz, message };
      if (side === 'A') host.vizA = next;
      else host.vizB = next;
      return undefined;
    },
  })
  .bridge('sort')
  .method('markDone', {
    requires: 'sort:control',
    input: z.object({}),
    output: z.undefined(),
    handler: ({ host, script }) => {
      const side = sideFromScript(script);
      const viz = vizForSide(host, side);
      const n = arrayForSide(host, side).length;
      const next = { ...viz, done: true, sortedPrefix: n, message: 'Done' };
      if (side === 'A') host.vizA = next;
      else host.vizB = next;
      return undefined;
    },
  })
  .componentHooks(sortingComponentHooks)
  .build();
