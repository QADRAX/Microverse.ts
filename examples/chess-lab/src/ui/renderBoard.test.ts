import { describe, expect, it } from 'vitest';

import { moveAnimationMs } from './renderBoard';

describe('moveAnimationMs', () => {
  it('scales with play delay and clamps', () => {
    expect(moveAnimationMs(0)).toBe(280);
    expect(moveAnimationMs(600)).toBe(450);
    expect(moveAnimationMs(2000)).toBe(600);
  });
});
