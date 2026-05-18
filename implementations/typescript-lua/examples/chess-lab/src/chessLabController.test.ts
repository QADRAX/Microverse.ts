import { describe, expect, it } from 'vitest';

import { ChessLabController } from './chessLabController';

describe('ChessLabController', () => {
  it('plays a short game random vs random', async () => {
    const controller = new ChessLabController();
    await controller.configure({
      engineWhite: 'random_move',
      engineBlack: 'random_move',
    });

    const maxPlies = 120;
    for (let i = 0; i < maxPlies && !controller.isGameOver(); i += 1) {
      await controller.step();
    }

    expect(controller.getBoardSnapshot().ply).toBeGreaterThan(0);
    await controller.dispose();
  }, 60_000);

  it('minimax_depth2 vs random completes without errors', async () => {
    const controller = new ChessLabController();
    await controller.configure({
      engineWhite: 'minimax_depth2',
      engineBlack: 'random_move',
    });

    for (let i = 0; i < 60 && !controller.isGameOver(); i += 1) {
      await controller.step();
    }

    expect(controller.getBoardSnapshot().ply).toBeGreaterThan(0);
    await controller.dispose();
  }, 90_000);

  it('greedy_material vs random makes progress without errors', async () => {
    const controller = new ChessLabController();
    await controller.configure({
      engineWhite: 'greedy_material',
      engineBlack: 'random_move',
    });

    for (let i = 0; i < 80 && !controller.isGameOver(); i += 1) {
      await controller.step();
    }

    expect(controller.getBoardSnapshot().fen).toContain(' ');
    await controller.dispose();
  }, 60_000);

  it('first_legal vs first_legal ends by repetition or mate within 120 plies', async () => {
    const controller = new ChessLabController();
    await controller.configure({
      engineWhite: 'first_legal',
      engineBlack: 'first_legal',
    });

    for (let i = 0; i < 120 && !controller.isGameOver(); i += 1) {
      await controller.step();
    }

    expect(controller.isGameOver()).toBe(true);
    const snap = controller.getBoardSnapshot();
    expect(snap.result).toBeDefined();
    await controller.dispose();
  }, 90_000);

  it.each([
    'first_legal',
    'capture_first',
    'prefer_checks',
    'avoid_hanging',
    'minimax_depth1',
  ] as const)('%s submits legal moves', async (engine) => {
    const controller = new ChessLabController();
    await controller.configure({
      engineWhite: engine,
      engineBlack: 'first_legal',
    });

    for (let i = 0; i < 40 && !controller.isGameOver(); i += 1) {
      await controller.step();
    }

    expect(controller.getBoardSnapshot().ply).toBeGreaterThan(0);
    await controller.dispose();
  }, 60_000);
});
