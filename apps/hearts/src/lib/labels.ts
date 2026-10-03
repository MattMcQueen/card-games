import {
  HUMAN_SEAT,
  hasWon,
  isGameOver,
  leaders,
  passTarget,
  pointsIn,
  type Card,
  type GameState,
  type Rank,
  type Suit,
} from '../engine';

const RANK_NAMES: Record<Rank, string> = {
  A: 'Ace', K: 'King', Q: 'Queen', J: 'Jack', '10': 'Ten', '9': 'Nine', '8': 'Eight', '7': 'Seven', '6': 'Six',
  '5': 'Five', '4': 'Four', '3': 'Three', '2': 'Two',
};
const SUIT_NAMES: Record<Suit, string> = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' };

/** "Queen of spades". */
export const cardName = (card: Card): string => `${RANK_NAMES[card.rank]} of ${SUIT_NAMES[card.suit]}`;

const points = (n: number) => `${n} ${n === 1 ? 'point' : 'points'}`;
const nameOf = (game: GameState, seat: number) => game.players[seat]?.name ?? '';

/** Where your cards go this hand: "to Terry, on your left". */
export function passText(game: GameState): string {
  const to = nameOf(game, passTarget(HUMAN_SEAT, game.direction));
  const where = { left: 'on your left', right: 'on your right', across: 'across the table', keep: '' }[game.direction];
  return `${to}, ${where}`;
}

/** The corner of the table: which way the cards were passed this hand. */
export function directionLabel(game: GameState): string {
  return game.direction === 'keep' ? 'No passing' : `Pass ${game.direction}`;
}

/** What you may do on your turn. */
export function turnText(game: GameState): string {
  const led = game.trick[0]?.card.suit;
  if (game.tricksPlayed === 0 && !led) return 'Your lead: the two of clubs starts the hand.';
  if (!led) return game.heartsBroken ? 'Your lead: any card.' : 'Your lead: any card but a heart (hearts are not broken yet).';
  const you = game.players[HUMAN_SEAT]!;
  if (you.hand.some((c) => c.suit === led)) return `Your turn: follow ${SUIT_NAMES[led]}.`;
  return game.tricksPlayed === 0
    ? `You have no ${SUIT_NAMES[led]}: play another suit (no points on the first trick).`
    : `You have no ${SUIT_NAMES[led]}: play any card.`;
}

/** Who took the complete trick, and what was in it: "Priya takes the trick (2 points)". */
export function trickText(game: GameState): string {
  const pts = pointsIn(game.trick.map((p) => p.card));
  const who = game.winner === HUMAN_SEAT ? 'You take' : `${nameOf(game, game.winner)} takes`;
  return `${who} the trick${pts > 0 ? ` (${points(pts)})` : ''}.`;
}

/** Names joined in a list: "Terry", "Terry and Priya", "Terry, Margaret and Priya". */
function list(names: string[]): string {
  return names.length < 2 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

/** How the game ended for you. */
export function gameOverText(game: GameState): string {
  const best = leaders(game);
  if (hasWon(game)) return best.length > 1 ? `You share the win with ${list(best.filter((s) => s !== HUMAN_SEAT).map((s) => nameOf(game, s)))}!` : 'You win the game!';
  return `${list(best.map((s) => nameOf(game, s)))} ${best.length > 1 ? 'share the win' : 'wins the game'}.`;
}

/** What screen readers hear: your prompt on your turn, the latest card played, who took a trick, or the hand's result. */
export function announcementFor(game: GameState, yourTurn: boolean): string {
  if (game.phase === 'passing') return `Choose three cards to pass to ${passText(game)}.`;
  if (game.phase === 'collecting') return trickText(game);
  if (game.phase === 'settled') {
    const mine = game.result?.points[HUMAN_SEAT] ?? 0;
    const hand = `This hand: you scored ${points(mine)}. Your total is ${game.players[HUMAN_SEAT]?.score ?? 0}.`;
    return isGameOver(game) ? `${hand} ${gameOverText(game)}` : hand;
  }
  const last = game.trick.at(-1);
  const played = last ? `${last.seat === HUMAN_SEAT ? 'You play' : `${nameOf(game, last.seat)} plays`} the ${cardName(last.card).toLowerCase()}. ` : '';
  return yourTurn ? `${played}${turnText(game)}` : played;
}
