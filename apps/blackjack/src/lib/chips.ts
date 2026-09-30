import type { ChipSet } from '@card-games/card-kit/chips';

/** Blackjack's chips: bets are small, so the chips are too. */
export const chipSet = { values: [20, 10, 5, 1] } as const satisfies ChipSet;
