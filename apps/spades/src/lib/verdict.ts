import type { Banner } from '@card-games/card-kit/banner';
import { HUMAN_SEAT, hasWon, isGameOver, teamOf, type GameState } from '../engine';
import { gameOverText, signed, score, teamName } from './labels';

export type { Banner };

/** The result of a hand once it is scored: how it went for your partnership, or how the game ended. */
export function bannerFor(game: GameState): Banner | null {
  const result = game.result;
  if (game.phase !== 'settled' || !result) return null;
  const ours = teamOf(HUMAN_SEAT);
  const [us, them] = [game.teams[ours]!.score, game.teams[1 - ours]!.score];
  if (isGameOver(game)) {
    return { tone: hasWon(game) ? 'win' : 'lose', main: gameOverText(game), sub: `The final score is ${score(us)} to ${score(them)}` };
  }
  const mine = result[ours]!;
  const sub = `Us ${signed(mine.points)}, them ${signed(result[1 - ours]!.points)}`;
  const you = game.players[HUMAN_SEAT]!;
  if (you.bid === 0) {
    return you.tricks === 0
      ? { tone: 'win', main: 'Your nil made!', sub }
      : { tone: 'lose', main: `Your nil failed: you took ${you.tricks}`, sub };
  }
  const side = teamName(game, ours);
  if (mine.contract < 0) return { tone: 'lose', main: `Set! ${side} took ${mine.tricks} of ${mine.bid}`, sub };
  return { tone: mine.nil < 0 ? 'lose' : 'win', main: `${side} made ${mine.bid}${mine.bags > 0 ? ` and ${mine.bags} over` : ''}`, sub };
}
