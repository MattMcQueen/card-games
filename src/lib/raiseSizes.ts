import type { LegalActions } from '../engine';

export interface RaiseSize {
  readonly label: string;
  /** The bet or raise this button sets up: a total for the street. */
  readonly to: number;
}

/**
 * The shortcut sizes for a bet or raise: the smallest, a share of the pot, and all-in. A share of the
 * pot means raising by that much once you have called (so "pot" is the most a pot-limit game would
 * allow), rounded to a 5 and kept between the smallest raise and all-in.
 */
export function raiseSizes(currentBet: number, pot: number, legal: LegalActions): RaiseSize[] {
  const sized = (share: number) => {
    const to = Math.round((currentBet + share * (pot + legal.toCall)) / 5) * 5;
    return Math.min(legal.maxRaiseTo, Math.max(legal.minRaiseTo, to));
  };
  return [
    { label: 'Min', to: legal.minRaiseTo },
    { label: '½ pot', to: sized(0.5) },
    { label: '¾ pot', to: sized(0.75) },
    { label: 'Pot', to: sized(1) },
    { label: 'All-in', to: legal.maxRaiseTo },
  ];
}
