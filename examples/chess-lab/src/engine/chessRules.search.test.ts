import { describe, expect, it } from 'vitest';

import { createGame, isMoveSafe, searchScore } from './chessRules';

describe('chessRules search helpers', () => {
  it('isMoveSafe accepts a normal pawn push', () => {
    const chess = createGame();
    expect(isMoveSafe(chess, { from: 'e2', to: 'e4' }, 'white')).toBe(true);
  });

  it('searchScore depth 2 returns finite scores for legal moves', () => {
    const chess = createGame();
    const score = searchScore(chess, { from: 'e2', to: 'e4', depth: 2 }, 'white');
    expect(score).toBeTypeOf('number');
    expect(Number.isFinite(score)).toBe(true);
  });
});
