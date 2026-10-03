import type { Banner } from '@card-games/card-kit/banner';
import { teamLabel } from '@card-games/cards-core';
import { HUMAN_SEAT, hasWon, isGameOver, teamOf, type GameState, type HandResult } from '../engine';
import { contractText, gameOverText, score, signed } from './labels';

export type { Banner };

/** What each side scored on a hand: "Us +620, them 0", and the game, if one was won. */
function pointsLine(result: HandResult): string {
  const ours = teamOf(HUMAN_SEAT);
  const points = (team: number) => result.entries.filter((e) => e.team === team).reduce((sum, e) => sum + e.points, 0);
  const gameWon = result.game === null ? '' : ` · Game to ${teamLabel(result.game).toLowerCase()}!`;
  return `Us ${signed(points(ours))}, them ${signed(points(1 - ours))}${gameWon}`;
}

/** How the contract went: good news for you if your side made it, or the other side went down. */
function contractBanner(game: GameState, result: HandResult): Banner {
  const contract = result.contract!;
  const declarer = contract.declarer === HUMAN_SEAT ? 'You' : game.players[contract.declarer]!.name;
  const made = result.margin >= 0;
  const main = made
    ? `${declarer} made ${contractText(contract)}${result.margin > 0 ? ` with ${result.margin} over` : ''}`
    : `${declarer} went down ${-result.margin} in ${contractText(contract)}`;
  return { tone: made === (teamOf(contract.declarer) === teamOf(HUMAN_SEAT)) ? 'win' : 'lose', main, sub: pointsLine(result) };
}

/** The result of a hand once it is scored: how the contract went, or how the rubber ended. */
export function bannerFor(game: GameState): Banner | null {
  if (game.phase !== 'settled' || !game.result) return null;
  if (isGameOver(game)) {
    const [us, them] = [game.teams[teamOf(HUMAN_SEAT)]!.total, game.teams[1 - teamOf(HUMAN_SEAT)]!.total];
    return { tone: hasWon(game) ? 'win' : 'lose', main: gameOverText(game), sub: `The final score is ${score(us)} to ${score(them)}` };
  }
  if (!game.result.contract) return { tone: 'lose', main: 'Passed out', sub: 'Nobody opened the bidding, so the hand is dealt again' };
  return contractBanner(game, game.result);
}
