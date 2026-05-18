import { describe, expect, it } from 'vitest';

import {
  createGame,
  moveWouldCauseThreefoldRepetition,
  positionRepetitionCount,
} from './chessRules';

describe('position repetition', () => {
  it('counts knight shuffle until threefold draw', () => {
    const chess = createGame();
    const seq = ['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1', 'Ng8'];
    for (const san of seq) {
      chess.move(san);
    }
    expect(positionRepetitionCount(chess)).toBe(3);
    expect(chess.isThreefoldRepetition()).toBe(true);
    expect(chess.isGameOver()).toBe(true);
  });

  it('flags moves that would claim threefold', () => {
    const chess = createGame();
    for (const san of ['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1']) {
      chess.move(san);
    }
    expect(positionRepetitionCount(chess)).toBe(2);
    const would = moveWouldCauseThreefoldRepetition(chess, { from: 'f6', to: 'g8' });
    expect(would).toBe(true);
  });
});
