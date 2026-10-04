import { cardName, type Suit } from '@card-games/cards-core';
import {
  BOT_SEAT,
  DISCARDS,
  HUMAN_SEAT,
  MAX_COUNT,
  currentShow,
  gameWinner,
  hasWon,
  isSkunk,
  mustGo,
  type Card,
  type Combo,
  type GameState,
  type Peg,
  type Show,
} from '../engine';

const SYMBOLS: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };

/** A card in a few characters: "7♥", "10♠". */
export const short = (card: Card): string => `${card.rank}${SYMBOLS[card.suit]}`;

/** The cards of a combination, short: "7♥ 8♠". */
const cardsText = (cards: readonly Card[]) => cards.map(short).join(' ');

/** Who a seat is, as the subject of a sentence: "You", "Ruth". */
const who = (game: GameState, seat: number): string => (seat === HUMAN_SEAT ? 'You' : game.players[seat]!.name);

/** Whose: "your", "Ruth's". */
const whose = (game: GameState, seat: number): string => (seat === HUMAN_SEAT ? 'your' : `${game.players[seat]!.name}'s`);

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** What some points were pegged for in the play, as called: "fifteen for 2", "a run of 4 for 4". */
export function pegText(peg: Peg): string {
  switch (peg.kind) {
    case 'heels':
      return 'two for his heels';
    case 'fifteen':
      return 'fifteen for 2';
    case 'thirtyOne':
      return 'thirty-one for 2';
    case 'pair':
      return peg.size === 4 ? 'four of a kind for 12' : peg.size === 3 ? 'three of a kind for 6' : 'a pair for 2';
    case 'run':
      return `a run of ${peg.size} for ${peg.points}`;
    case 'go':
      return 'one for the go';
    case 'lastCard':
      return 'one for the last card';
  }
}

/** The latest points pegged in the play, on the table: "Ruth: fifteen for 2 and a pair for 2". Empty if none. */
export function scoredText(game: GameState): string {
  const scored = game.scored;
  if (!scored || scored.pegs.length === 0) return '';
  return `${who(game, scored.seat)}: ${scored.pegs.map(pegText).join(' and ')}`;
}

/** The title of a hand counted in the show: "Your hand", "Ruth's crib". */
export const showTitle = (game: GameState, show: Show): string => capital(`${whose(game, show.seat)} ${show.crib ? 'crib' : 'hand'}`);

/** One combination in a count, called as the running total goes up: "fifteen 2", "a run of three is 9". */
function call(combo: Combo, total: number): string {
  switch (combo.kind) {
    case 'fifteen':
      return `fifteen ${total}`;
    case 'pair':
      return `a pair is ${total}`;
    case 'run':
      return `a run of ${combo.points} is ${total}`;
    case 'flush':
      return `a flush is ${total}`;
    case 'nob':
      return `his nob is ${total}`;
  }
}

/**
 * A count in the show, called the way players say it: "Fifteen 2, fifteen 4, a pair is 6 and a run of three is 9."
 * Each part, with the cards that make it, for the list under the table.
 */
export function countCalls(show: Show): { text: string; cards: string }[] {
  let total = 0;
  return show.count.combos.map((combo) => {
    total += combo.points;
    return { text: call(combo, total), cards: cardsText(combo.cards) };
  });
}

/** A whole count in one sentence, for screen readers and the line under the table: "Your hand: fifteen 2 and a pair is 4." */
export function countText(game: GameState, show: Show): string {
  const calls = countCalls(show).map((c) => c.text);
  const said = calls.length === 0 ? 'nineteen, which is nothing at all' : calls.length === 1 ? calls[0]! : `${calls.slice(0, -1).join(', ')} and ${calls.at(-1)}`;
  return `${showTitle(game, show)} with the ${cardName(game.starter!).toLowerCase()}: ${said}.`;
}

/** What the button to count the next hand in the show says. */
export function nextCountText(game: GameState): string {
  return game.shows.length === 1 ? `Count ${whose(game, game.dealer)} hand` : `Count ${whose(game, game.dealer)} crib`;
}

/** What you may do on your turn in the play. */
export function turnText(game: GameState): string {
  if (mustGo(game)) return `The count is ${game.count}: you cannot play without going over ${MAX_COUNT}, so say go.`;
  if (game.count === 0) return 'Your lead: play any card.';
  const room = MAX_COUNT - game.count;
  return room >= 10 ? `The count is ${game.count}: your turn.` : `The count is ${game.count}: play a card worth ${room} or less.`;
}

/** The cut for the first deal, said in the first hand: "You cut the 4♥ and Ruth the J♣, so you deal." */
export function cutText(game: GameState): string {
  const [yours, theirs] = game.cut;
  if (game.hand !== 1 || !yours || !theirs) return '';
  return `You cut the ${short(yours)} and ${game.players[BOT_SEAT]!.name} the ${short(theirs)}, so ${game.dealer === HUMAN_SEAT ? 'you deal' : `${game.players[BOT_SEAT]!.name} deals`}.`;
}

/** What to do while discarding. */
export const discardText = (game: GameState): string => `Choose ${DISCARDS} cards for ${whose(game, game.dealer)} crib.`;

/** The line under the table: what you may do, who it is waiting for, or what has just happened. */
export function statusText(game: GameState): string {
  switch (game.phase) {
    case 'discarding':
      return discardText(game);
    case 'pegging': {
      const scored = scoredText(game);
      const then = scored ? `${scored}. ` : '';
      return game.toPlay === HUMAN_SEAT ? `${then}${turnText(game)}` : `${then}${game.players[BOT_SEAT]!.name} is choosing a card…`;
    }
    case 'collecting':
      return `${scoredText(game) || 'Thirty-one'}. The count starts again.`;
    case 'showing':
    case 'settled': {
      const show = currentShow(game);
      return show ? countText(game, show) : '';
    }
  }
}

/** How the game ended for you. */
export function gameOverText(game: GameState): string {
  const winner = gameWinner(game);
  if (winner < 0) return '';
  const skunk = isSkunk(game) ? (winner === HUMAN_SEAT ? `, and skunked ${game.players[BOT_SEAT]!.name}` : ': you were skunked') : '';
  return hasWon(game) ? `You win the game${skunk}!` : `${game.players[winner]!.name} wins the game${skunk}.`;
}

/** The score, yours first: "37 to 52". */
export const scoreLine = (game: GameState): string => `${game.players[HUMAN_SEAT]!.score} to ${game.players[BOT_SEAT]!.score}`;

/** Something a player did, said for screen readers: "You play", "Ruth says". */
const does = (game: GameState, seat: number, verb: string) => `${who(game, seat)} ${seat === HUMAN_SEAT ? verb : `${verb}s`}`;

/** A count in the show, or the end of the game, and the score, for screen readers. */
function showAnnouncement(game: GameState): string {
  const over = gameOverText(game);
  const show = currentShow(game);
  const said = [show ? countText(game, show) : '', over, `The score is ${scoreLine(game)}.`];
  return said.filter(Boolean).join(' ');
}

/** The latest card played or "go", the points pegged, and your prompt on your turn, for screen readers. */
function playAnnouncement(game: GameState): string {
  const last = game.pile.at(-1);
  const goer = game.go.indexOf(true);
  const said = [
    last ? `${does(game, last.seat, 'play')} the ${cardName(last.card).toLowerCase()} for ${game.count}.` : '',
    goer >= 0 && !game.scored ? `${does(game, goer, 'say')} go.` : '',
    game.scored ? `${scoredText(game)}.` : '',
    game.phase === 'pegging' && game.toPlay === HUMAN_SEAT ? turnText(game) : '',
  ];
  return said.filter(Boolean).join(' ');
}

/** What screen readers hear: the cut and what to discard, the play as it goes, or the counts of the show. */
export function announcementFor(game: GameState): string {
  if (game.phase === 'discarding') return `${cutText(game)} ${discardText(game)}`.trim();
  return game.phase === 'showing' || game.phase === 'settled' ? showAnnouncement(game) : playAnnouncement(game);
}
