import { SUIT_NAMES, tableAnnouncement, tableNote, teamName as partnersName, winnersText, type TableTexts } from '@card-games/cards-core';
import { HUMAN_SEAT, PARTNER_SEAT, isGameOver, teamOf, winningTeam, type GameState, type Player } from '../engine';

/** A score, with a proper minus sign: "120", "−70". */
export const score = (n: number): string => (n < 0 ? `−${-n}` : String(n));

/** A change in score with its sign: "+51", "−70". */
export const signed = (n: number): string => (n > 0 ? `+${n}` : score(n));

const tricks = (n: number) => `${n} ${n === 1 ? 'trick' : 'tricks'}`;
const points = (n: number) => `${n} ${n === 1 || n === -1 ? 'point' : 'points'}`;
const nameOf = (game: GameState, seat: number) => game.players[seat]?.name ?? '';

/** A bid in words: "nil", "4". */
export const bidText = (bid: number): string => (bid === 0 ? 'nil' : String(bid));

/** A partnership's name: "You and Grace", "Omar and Lena". */
export const teamName = (game: GameState, team: number): string => partnersName(game.players, team);

/** What a player has bid, for the line under the table: "Grace bid 4", "Omar bid nil". */
const bidBy = (p: Player) => `${p.human ? 'You' : p.name} bid ${bidText(p.bid!)}`;

/** The prompt for your bid, with what has been bid so far. */
export function bidPrompt(game: GameState): string {
  const partner = game.players[PARTNER_SEAT]!;
  const said = game.players.filter((p) => p.bid !== null && !p.human);
  const before = said.length > 0 ? `${said.map(bidBy).join(', ')}. ` : '';
  const help = partner.bid === null ? '' : partner.bid === 0 ? ' Your partner is going nil: cover them.' : '';
  return `${before}How many tricks will you take?${help}`;
}

/** What you may do on your turn. */
export function turnText(game: GameState): string {
  const led = game.trick[0]?.card.suit;
  if (!led) return game.spadesBroken ? 'Your lead: any card.' : 'Your lead: any card but a spade (spades are not broken yet).';
  const you = game.players[HUMAN_SEAT]!;
  if (you.hand.some((c) => c.suit === led)) return `Your turn: follow ${SUIT_NAMES[led]}.`;
  return led === 'S' ? 'You have no spades: play any card.' : `You have no ${SUIT_NAMES[led]}: play any card, or trump it with a spade.`;
}

/** Who took the complete trick: "Grace takes the trick." */
export function trickText(game: GameState): string {
  return `${game.winner === HUMAN_SEAT ? 'You take' : `${nameOf(game, game.winner)} takes`} the trick.`;
}

/** What is said about the hand being played: on the line under the table, and to screen readers. */
function say(game: GameState): TableTexts {
  return {
    taking: () => trickText(game),
    yourTurn: () => turnText(game),
    waiting: () => `${nameOf(game, game.toPlay)} is ${game.phase === 'bidding' ? 'bidding' : 'choosing a card'}…`,
    settled: () => {
      const [us, them] = game.teams.map((t) => score(t.score));
      const hand = `This hand: us, ${resultText(game, 0)}; them, ${resultText(game, 1)}. The score is ${us} to ${them}.`;
      return isGameOver(game) ? `${hand} ${gameOverText(game)}` : hand;
    },
  };
}

/** The line under the table while a hand is played: who took the trick, what you may play, or who is bidding or choosing a card. */
export const statusText = (game: GameState): string => tableNote(game, say(game));

/** How the game ended for you. */
export function gameOverText(game: GameState): string {
  const winner = winningTeam(game);
  return winner === null ? '' : winnersText(game.players, winner, 'the game');
}

/** How a hand went for one partnership, in words: "Bid 5, took 6: 51 points". */
function resultText(game: GameState, team: number): string {
  const r = game.result?.[team];
  if (!r) return '';
  return `bid ${r.bid}, took ${tricks(r.tricks)}: ${points(r.points)}`;
}

/** What screen readers hear: your prompt on your turn, the latest bid or card played, who took a trick, or the hand's result. */
export function announcementFor(game: GameState, yourTurn: boolean): string {
  if (game.phase === 'bidding') {
    const last = game.players.find((p) => p.id === (game.toPlay + 3) % 4 && p.bid !== null);
    const heard = last ? `${bidBy(last)}. ` : '';
    return game.toPlay === HUMAN_SEAT ? `${heard}Your bid: how many tricks will you take?` : heard;
  }
  return tableAnnouncement(game, yourTurn, say(game));
}
