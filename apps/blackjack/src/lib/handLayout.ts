/**
 * How far each card tucks under the one before it, as a fraction of a card's width (negative: overlapping).
 * From four cards on the hand stays as wide as four cards half-overlapped (2.5 cards), so a dealer who
 * draws five or six never reaches the shoe in the corner, even on a small phone.
 */
export function cardOverlap(count: number): number {
  if (count >= 4) return -(1 - 1.5 / (count - 1));
  return count === 3 ? -0.3 : 0.08;
}
