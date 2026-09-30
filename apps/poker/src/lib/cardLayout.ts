import type { Rank } from '../engine';

export interface Pip {
  readonly x: number;
  readonly y: number;
  /** Pips in the lower half of the card are printed upside down, as on a real card. */
  readonly flip: boolean;
}

const L = 34;
const C = 50;
const R = 66;

/** Classic pip positions on a 100 x 140 card, for the number cards 2 to 10. */
const layouts: Partial<Record<Rank, readonly (readonly [number, number])[]>> = {
  '2': [[C, 28], [C, 112]],
  '3': [[C, 28], [C, 70], [C, 112]],
  '4': [[L, 28], [R, 28], [L, 112], [R, 112]],
  '5': [[L, 28], [R, 28], [C, 70], [L, 112], [R, 112]],
  '6': [[L, 28], [R, 28], [L, 70], [R, 70], [L, 112], [R, 112]],
  '7': [[L, 28], [R, 28], [C, 49], [L, 70], [R, 70], [L, 112], [R, 112]],
  '8': [[L, 28], [R, 28], [C, 49], [L, 70], [R, 70], [C, 91], [L, 112], [R, 112]],
  '9': [[L, 28], [R, 28], [L, 56], [R, 56], [C, 70], [L, 84], [R, 84], [L, 112], [R, 112]],
  '10': [
    [L, 28], [R, 28], [C, 42], [L, 53], [R, 53],
    [L, 87], [R, 87], [C, 98], [L, 112], [R, 112],
  ],
};

export function pipsFor(rank: Rank): Pip[] {
  return (layouts[rank] ?? []).map(([x, y]) => ({ x, y, flip: y > 70 }));
}

export function isFaceCard(rank: Rank): boolean {
  return rank === 'J' || rank === 'Q' || rank === 'K';
}
