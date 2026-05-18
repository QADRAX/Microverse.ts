import { describe, expect, it } from 'vitest';

import { instanceMetaLine, instancePanelTitle } from './sortingLabCopy';

describe('sortingLabCopy', () => {
  it('names instances not separate microverses', () => {
    expect(instancePanelTitle('A', 'Bubble sort')).toBe('Instance A — Bubble sort');
    expect(instanceMetaLine('B')).toContain('instanceId "B"');
    expect(instanceMetaLine('B')).toContain('onTick');
  });
});
