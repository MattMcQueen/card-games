import { SUIT_NAMES, tableAnnouncement, tableNote, teamName as partnersName, winnersText, type TableTexts } from '@card-games/cards-core';
import {
  BOOK,
  HUMAN_SEAT,
  controllerOf,
  dummyOf,
  hasWon,
  isGameOver,
  sideTricks,
  teamOf,
  winningTeam,
  type Call,
  type Contract,
  type GameState,
  type HandResult,
  type Strain,
  type Turn,
} from '../engine';

/** A score, with a proper minus sign: "120", "−70". */
export const score = (n: number): string => (n < 0 ? `−${-n}` : String(n));

/** A change in score with its sign: "+120". */
export const signed = (n: number): string => (n > 0 ? `+${n}` : score(n));

export const SYMBOLS: Record<Strain, string> = { C: '♣', D: '♦', H: '♥', S: '♠', NT: 'NT' };
const STRAIN_WORDS: Record<Strain, [string, string]> = {
  C: ['club', 'clubs'],
  D: ['diamond', 'diamonds'],
  H: ['heart', 'hearts'],
  S: ['spade', 'spades'],
  NT: ['no trump', 'no trumps'],
};

/** A call as it is written: "1♥", "3NT", "Pass", "Double", "Redouble". */
export function callText(call: Call): string {
  if (call.kind === 'bid') return `${call.level}${SYMBOLS[call.strain]}`;
  return { pass: 'Pass', double: 'Double', redouble: 'Redouble' }[call.kind];
}

/** A call in words, for screen readers: "1 heart", "3 no trumps", "pass". */
export function callWords(call: Call): string {
  if (call.kind !== 'bid') return call.kind;
  return `${call.level} ${STRAIN_WORDS[call.strain][call.level === 1 ? 0 : 1]}`;
}

const nameOf = (game: GameState, seat: number) => game.players[seat]?.name ?? '';

/** The contract as it is written: "4♠", "3NT doubled". */
export function contractText(contract: Contract): string {
  const doubled = ['', ' doubled', ' redoubled'][contract.doubled];
  return `${contract.level}${SYMBOLS[contract.strain]}${doubled}`;
}

/** The contract and who plays it: "4♠ by Helen", "3NT doubled by you". */
export function contractBy(game: GameState, contract: Contract): string {
  return `${contractText(contract)} by ${contract.declarer === HUMAN_SEAT ? 'you' : nameOf(game, contract.declarer)}`;
}

/** A partnership's name: "You and Helen", "Arjun and Mei". */
export const teamName = (game: GameState, team: number): string => partnersName(game.players, team);

/** The tricks a side needs this hand: the declarers their contract, the defenders enough to beat it. */
function tricksNeeded(contract: Contract, team: number): number {
  const contracted = BOOK + contract.level;
  return team === teamOf(contract.declarer) ? contracted : 13 - contracted + 1;
}

/** The calls since you last called (or since the start), by the others: "Arjun 1♥, Helen pass, Mei 2♣". */
function callsSinceYours(game: GameState): Turn[] {
  const yours = game.auction.map((t) => t.seat).lastIndexOf(HUMAN_SEAT);
  return game.auction.slice(yours + 1);
}

const said = (game: GameState, t: Turn) => `${nameOf(game, t.seat)} ${t.call.kind === 'bid' ? callText(t.call) : t.call.kind}`;

/** The prompt for your call, with what the others have said since your last one. */
export function bidPrompt(game: GameState): string {
  const since = callsSinceYours(game);
  if (game.auction.length === 0) return 'You deal, so you call first.';
  return `${since.map((t) => said(game, t)).join(', ')}. Your call.`;
}

/** What you may do on your turn: play from your hand, or (when you declare) from the dummy. */
export function turnText(game: GameState): string {
  const fromDummy = game.toPlay !== HUMAN_SEAT;
  const where = fromDummy ? ` from ${nameOf(game, game.toPlay)}’s hand (the dummy)` : '';
  const led = game.trick[0]?.card.suit;
  if (!led) return fromDummy ? `Lead${where}.` : game.taken.length === 0 ? 'Your opening lead: any card.' : 'Your lead: any card.';
  const hand = game.players[game.toPlay]!.hand;
  if (hand.some((c) => c.suit === led)) return `Play${where}: follow ${SUIT_NAMES[led]}.`;
  return `No ${SUIT_NAMES[led]}${fromDummy ? ' in the dummy' : ''}: play any card.`;
}

/** Who took the complete trick: "Helen takes the trick." */
function trickText(game: GameState): string {
  return `${game.winner === HUMAN_SEAT ? 'You take' : `${nameOf(game, game.winner)} takes`} the trick.`;
}

/** Who the table is waiting for: "Mei is bidding…", "Helen is choosing a card from the dummy…". */
function waitingText(game: GameState): string {
  if (game.phase === 'bidding') return `${nameOf(game, game.toPlay)} is bidding…`;
  const controller = controllerOf(game, game.toPlay);
  const fromDummy = controller !== game.toPlay ? (game.toPlay === HUMAN_SEAT ? ' from your hand (you are the dummy)' : ' from the dummy') : '';
  return `${nameOf(game, controller)} is choosing a card${fromDummy}…`;
}

/** What is said about the hand being played: on the line under the table, and to screen readers. */
function say(game: GameState): TableTexts {
  return {
    taking: () => trickText(game),
    yourTurn: () => turnText(game),
    waiting: () => waitingText(game),
    settled: () => {
      const hand = game.result ? `${resultText(game, game.result)}.` : '';
      return isGameOver(game) ? `${hand} ${gameOverText(game)}` : hand;
    },
  };
}

/** Whose turn it is, as the table sees it: yours when you play the dummy's cards. */
const asSeen = (game: GameState): GameState => (game.phase === 'playing' && controllerOf(game, game.toPlay) === HUMAN_SEAT ? { ...game, toPlay: HUMAN_SEAT } : game);

/** The line under the table: who is bidding, who took the trick, what you may play, or who is choosing a card. */
export const statusText = (game: GameState): string => tableNote(asSeen(game), say(game));

/** How the rubber ended for you. */
export function gameOverText(game: GameState): string {
  const winner = winningTeam(game);
  return winner === null ? '' : winnersText(game.players, winner, 'the rubber');
}

/** How a hand went, in words: "4♠ by Helen, made with 1 over", "3NT by you, down 2", "Passed out". */
export function resultText(game: GameState, result: HandResult): string {
  if (!result.contract) return 'All four passed: no score';
  const how = result.margin < 0 ? `down ${-result.margin}` : result.margin === 0 ? 'made' : `made with ${result.margin} over`;
  return `${contractBy(game, result.contract)}, ${how}`;
}

/** What screen readers hear: the latest call (and your prompt on your turn), cards played, tricks taken, and results. */
export function announcementFor(game: GameState, yourTurn: boolean): string {
  if (game.phase === 'bidding') {
    const last = game.auction.at(-1);
    const heard = last ? `${last.seat === HUMAN_SEAT ? 'You say' : `${nameOf(game, last.seat)} says`} ${callWords(last.call)}. ` : '';
    return yourTurn ? `${heard}Your call.` : heard;
  }
  if (game.phase === 'playing' && game.trick.length === 0 && game.taken.length === 0 && game.contract) {
    const lead = yourTurn ? ` ${turnText(game)}` : '';
    return `The contract is ${contractBy(game, game.contract)}.${lead}`;
  }
  return tableAnnouncement(asSeen(game), yourTurn, say(game));
}

/** The tricks a player's side has taken, and how many it needs, for the name plates. */
export function sideCount(game: GameState, seat: number): { took: number; need: number } {
  const team = teamOf(seat);
  return { took: sideTricks(game, team), need: tricksNeeded(game.contract!, team) };
}

/** A player's last call, while the auction is on. */
export function lastCallOf(game: GameState, seat: number): Call | undefined {
  if (game.phase !== 'bidding') return undefined;
  return game.auction.filter((t) => t.seat === seat).at(-1)?.call;
}

/** The role a player has in the play of the hand. */
export function roleOf(game: GameState, seat: number): 'Declarer' | 'Dummy' | null {
  if (!game.contract) return null;
  if (seat === game.contract.declarer) return 'Declarer';
  return seat === dummyOf(game.contract) ? 'Dummy' : null;
}
