import type { ChipSet } from '@card-games/card-kit/chips';

/** Poker's chips, for stacks of thousands. At most 8 are shown in a stack, so a huge pot still fits on the table. */
export const chipSet: ChipSet = { values: [500, 100, 25, 5, 1], limit: 8 };
