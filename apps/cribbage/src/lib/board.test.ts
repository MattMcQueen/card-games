import { describe, expect, it } from 'vitest';
import { BOARD_HEIGHT, BOARD_WIDTH, endHoles, holeAt, holesOf, skunkLine } from './board';

describe('the pegging board', () => {
  it('runs each track out and back, from the start hole to the game hole beside it', () => {
    for (const seat of [0, 1]) {
      const start = holeAt(seat, 0);
      expect(holeAt(seat, 1).y).toBe(start.y);
      expect(holeAt(seat, 1).x).toBeGreaterThan(start.x);
      expect(holeAt(seat, 60).x).toBe(holeAt(seat, 61).x);
      expect(holeAt(seat, 120).x).toBe(holeAt(seat, 1).x);
      expect(holeAt(seat, 121).x).toBe(start.x);
      expect(holeAt(seat, 200)).toEqual(holeAt(seat, 121));
    }
  });

  it('gives every hole its own place, inside the board', () => {
    const all = [...holesOf(0), ...holesOf(1), ...endHoles];
    expect(new Set(all.map(({ x, y }) => `${x},${y}`)).size).toBe(244);
    for (const { x, y } of all) {
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(BOARD_WIDTH);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(BOARD_HEIGHT);
    }
  });

  it('puts the computer player on the top half and you on the bottom', () => {
    expect(Math.max(...holesOf(1).map((h) => h.y))).toBeLessThan(Math.min(...holesOf(0).map((h) => h.y)));
  });

  it('draws the skunk line between 90 and 91', () => {
    const line = skunkLine(0);
    expect(line.x).toBeGreaterThan(holeAt(0, 91).x);
    expect(line.x).toBeLessThan(holeAt(0, 90).x);
  });
});
