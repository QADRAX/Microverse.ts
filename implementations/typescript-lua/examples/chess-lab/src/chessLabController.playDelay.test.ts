import { describe, expect, it } from 'vitest';

import { clampPlayDelayMs } from './chessLabController';

describe('clampPlayDelayMs', () => {
  it('clamps to 0–10000 and rounds', () => {
    expect(clampPlayDelayMs(600)).toBe(600);
    expect(clampPlayDelayMs(-1)).toBe(0);
    expect(clampPlayDelayMs(50_000)).toBe(10_000);
    expect(clampPlayDelayMs(599.6)).toBe(600);
  });

  it('falls back when not finite', () => {
    expect(clampPlayDelayMs(Number.NaN)).toBe(600);
  });
});
