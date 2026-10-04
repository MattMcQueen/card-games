import type { Banner } from '@card-games/card-kit/banner';
import { hasWon, isGameOver, type GameState } from '../engine';
import { gameOverText, scoreLine } from './labels';

export type { Banner };

/** The end of the game, on the table: who won, and the final score. Null while the game goes on. */
export function bannerFor(game: GameState): Banner | null {
  if (!isGameOver(game)) return null;
  return { tone: hasWon(game) ? 'win' : 'lose', main: gameOverText(game), sub: `The final score is ${scoreLine(game)}` };
}
