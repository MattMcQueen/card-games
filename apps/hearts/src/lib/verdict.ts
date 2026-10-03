import { HUMAN_SEAT, isGameOver, hasWon, isQueenOfSpades, type GameState } from '../engine';
import { gameOverText } from './labels';

export interface Banner {
  /** Whether it is good news for you. */
  readonly tone: 'win' | 'lose';
  readonly main: string;
  readonly sub: string;
}

const points = (n: number) => (n === 0 ? 'no points' : `${n} ${n === 1 ? 'point' : 'points'}`);

/** The result of a hand once it is scored: how it went for you, or how the game ended. */
export function bannerFor(game: GameState): Banner | null {
  const result = game.result;
  if (game.phase !== 'settled' || !result) return null;
  const name = (seat: number) => game.players[seat]?.name ?? '';
  if (isGameOver(game)) {
    const you = game.players[HUMAN_SEAT]?.score ?? 0;
    return { tone: hasWon(game) ? 'win' : 'lose', main: gameOverText(game), sub: `You finished on ${you}` };
  }
  if (result.moon !== null) {
    return result.moon === HUMAN_SEAT
      ? { tone: 'win', main: 'You shot the moon!', sub: 'Everyone else scores 26' }
      : { tone: 'lose', main: `${name(result.moon)} shot the moon`, sub: 'Everyone else scores 26' };
  }
  const mine = result.points[HUMAN_SEAT] ?? 0;
  const queen = game.players.find((p) => p.taken.some(isQueenOfSpades));
  return {
    tone: mine === Math.min(...result.points) ? 'win' : 'lose',
    main: `You took ${points(mine)}`,
    sub: queen ? `${queen.human ? 'You' : queen.name} took the queen of spades` : '',
  };
}
