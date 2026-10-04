import { cardKey, createDeck, secureRandomInt, shuffle, type RandomInt } from '@card-games/cards-core';
import { BOT, BOT_SEAT, DEAL_SIZE, DISCARDS, GAME_POINTS, HUMAN_SEAT, MAX_COUNT, PLAYERS, SKUNK_LINE } from './constants';
import { countHand, pegPoints, peggingScores, pipValue, runRank, sortHand } from './scoring';
import type { Card, GameState, Peg, Player, Show, Tally } from './types';

export { cardKey, sortHand };

/** The other player. */
const other = (seat: number): number => 1 - seat;

const same = (a: Card) => (b: Card) => cardKey(a) === cardKey(b);
const NO_POINTS: Tally = { pegging: 0, hand: 0, crib: 0 };

/** The player who has reached GAME_POINTS and won, or -1 while the game goes on. */
export const gameWinner = (state: GameState): number => state.players.findIndex((p) => p.score >= GAME_POINTS);

export const isGameOver = (state: GameState): boolean => gameWinner(state) >= 0;

/** You have won a finished game. */
export const hasWon = (state: GameState): boolean => gameWinner(state) === HUMAN_SEAT;

/** The loser of a finished game has not passed the skunk line. */
export const isSkunk = (state: GameState): boolean => {
  const winner = gameWinner(state);
  return winner >= 0 && state.players[other(winner)]!.score < SKUNK_LINE;
};

/**
 * Cuts for the first deal from a shuffled deck: each player cuts a card, and the lower deals (aces are low).
 * Cards of the same rank are put aside and both cut again. Returns the cards cut, by seat, and the dealer.
 */
function cutForDeal(randomInt: RandomInt): { cut: Card[]; dealer: number } {
  const deck = shuffle(createDeck(), randomInt);
  for (let i = 0; i + 1 < deck.length; i += 2) {
    const cut = [deck[i]!, deck[i + 1]!];
    if (cut[0]!.rank !== cut[1]!.rank) return { cut, dealer: runRank(cut[0]!) < runRank(cut[1]!) ? 0 : 1 };
  }
  throw new Error('Every cut was a tie');
}

/** What carries on from hand to hand: the players and their scores, the first cut, and the score sheet. */
type Kept = Pick<GameState, 'players' | 'cut' | 'history'>;

/** Deals hand number `hand`: six cards each, one at a time, starting with the player who is not `dealer`. */
function deal({ players: seated, cut, history }: Kept, hand: number, dealer: number, randomInt: RandomInt): GameState {
  const deck = shuffle(createDeck(), randomInt);
  const dealt = deck.slice(0, DEAL_SIZE * PLAYERS);
  const players = seated.map((p) => ({
    ...p,
    hand: sortHand(dealt.filter((_, i) => i % PLAYERS === (p.id === dealer ? 1 : 0))),
    kept: [],
  }));
  return {
    cut,
    history,
    phase: 'discarding',
    hand,
    dealer,
    players,
    stock: deck.slice(DEAL_SIZE * PLAYERS),
    crib: [],
    starter: null,
    pile: [],
    count: 0,
    go: [false, false],
    toPlay: -1,
    lastPlayer: -1,
    scored: null,
    shows: [],
    tally: [NO_POINTS, NO_POINTS],
  };
}

/** A new game: both players on 0, a cut for the first deal, and the first hand dealt. */
export function newGame(randomInt: RandomInt = secureRandomInt): GameState {
  const { cut, dealer } = cutForDeal(randomInt);
  const players: Player[] = [HUMAN_SEAT, BOT_SEAT].map((id) => ({
    id,
    name: id === HUMAN_SEAT ? 'You' : BOT.name,
    human: id === HUMAN_SEAT,
    hand: [],
    kept: [],
    score: 0,
    previous: 0,
  }));
  return deal({ players, cut, history: [] }, 1, dealer, randomInt);
}

/** The next hand, once this one is over and the game is not: the deal, and with it the crib, passes to the other player. */
export function nextHand(state: GameState, randomInt: RandomInt = secureRandomInt): GameState {
  if (state.phase !== 'settled' || isGameOver(state)) throw new Error('There is no next hand now');
  return deal(state, state.hand + 1, other(state.dealer), randomInt);
}

/**
 * `seat` pegs `points` (for `part` of the hand, and in the play for `pegs`). At GAME_POINTS the game is over
 * at once, and the hand with it.
 */
function peg(state: GameState, seat: number, points: number, part: keyof Tally, pegs: readonly Peg[] = []): GameState {
  if (points === 0) return state;
  const players = state.players.map((p) =>
    p.id === seat ? { ...p, previous: p.score, score: Math.min(GAME_POINTS, p.score + points) } : p,
  );
  const tally = state.tally.map((t, s) => (s === seat ? { ...t, [part]: t[part] + points } : t));
  const next: GameState = { ...state, players, tally, scored: { seat, points, pegs } };
  return isGameOver(next) ? settle(next) : next;
}

/** The hand is over: its points go on the score sheet. */
const settle = (state: GameState): GameState => ({ ...state, phase: 'settled', toPlay: -1, history: [...state.history, state.tally] });

/**
 * Both players put DISCARDS cards in the dealer's crib (`picks`, by seat), and the starter is cut. If it is a jack,
 * the dealer pegs two for his heels. Then the player who did not deal plays first.
 */
export function discard(state: GameState, picks: readonly (readonly Card[])[]): GameState {
  if (state.phase !== 'discarding') throw new Error('Not discarding now');
  const players = state.players.map((p) => {
    const pick = picks[p.id] ?? [];
    if (pick.length !== DISCARDS || !pick.every((c) => p.hand.some(same(c))) || same(pick[0]!)(pick[1]!)) {
      throw new Error(`${p.name} must put ${DISCARDS} of their own cards in the crib`);
    }
    const kept = p.hand.filter((c) => !pick.some(same(c)));
    return { ...p, hand: kept, kept };
  });
  const starter = state.stock[0]!;
  const cut: GameState = {
    ...state,
    phase: 'pegging',
    players,
    crib: picks.flat(),
    starter,
    stock: state.stock.slice(1),
    toPlay: other(state.dealer),
  };
  return starter.rank === 'J' ? peg(cut, state.dealer, 2, 'pegging', [{ kind: 'heels', points: 2 }]) : cut;
}

/** The cards `seat` may play now: those that keep the count at 31 or under. None means they must say "go". */
export function legalCards(state: GameState, seat = state.toPlay): Card[] {
  if (state.phase !== 'pegging' || seat !== state.toPlay) return [];
  return state.players[seat]!.hand.filter((c) => state.count + pipValue(c) <= MAX_COUNT);
}

/** It is `seat`'s turn and they cannot play without going over 31: they must say "go". */
export const mustGo = (state: GameState, seat = state.toPlay): boolean =>
  state.phase === 'pegging' && seat === state.toPlay && legalCards(state, seat).length === 0;

const hasCards = (state: GameState, seat: number): boolean => state.players[seat]!.hand.length > 0;
const canPlay = (state: GameState, seat: number): boolean => state.players[seat]!.hand.some((c) => state.count + pipValue(c) <= MAX_COUNT);

/**
 * Whose turn it is after `seat` has played, or -1 if the count is over: at 31, or when neither player can go on.
 * The other player plays next unless they have said "go" or have no cards left, and then `seat` carries on if they can.
 */
function nextToPlay(state: GameState, seat: number): number {
  if (state.count === MAX_COUNT) return -1;
  const them = other(seat);
  if (hasCards(state, them) && !state.go[them]) return them;
  return canPlay(state, seat) ? seat : -1;
}

/**
 * The count is over: its cards wait on the table to be turned over. Unless it reached 31, whoever played its last
 * card pegs one: for the go, or for the last card of the play.
 */
function endCount(state: GameState, pegs: readonly Peg[]): GameState {
  const lastPlayer = state.pile.at(-1)!.seat;
  const allPlayed = state.players.every((p) => p.hand.length === 0);
  const bonus: Peg[] = state.count === MAX_COUNT ? [] : [{ kind: allPlayed ? 'lastCard' : 'go', points: 1 }];
  const ended: GameState = { ...state, phase: 'collecting', toPlay: -1, lastPlayer };
  const all = [...pegs, ...bonus];
  return peg(ended, lastPlayer, pegPoints(all), 'pegging', all);
}

/** The player whose turn it is lays `card` and calls the new count, pegging what it makes. */
export function playCard(state: GameState, card: Card): GameState {
  const seat = state.toPlay;
  if (!legalCards(state).some(same(card))) throw new Error(`${state.players[seat]?.name ?? 'Nobody'} may not play ${cardKey(card)} now`);
  const players = state.players.map((p) => (p.id === seat ? { ...p, hand: p.hand.filter((c) => !same(card)(c)) } : p));
  const pile = [...state.pile, { seat, card }];
  const played: GameState = { ...state, players, pile, count: state.count + pipValue(card), scored: null };
  const pegs = peggingScores(pile.map((p) => p.card));
  const next = nextToPlay(played, seat);
  if (next < 0) return endCount(played, pegs);
  const pegged = peg(played, seat, pegPoints(pegs), 'pegging', pegs);
  return pegged.phase === 'settled' ? pegged : { ...pegged, toPlay: next };
}

/** The player whose turn it is cannot play, and says "go": the other player carries on while they can. */
export function sayGo(state: GameState): GameState {
  if (!mustGo(state)) throw new Error('Only a player who cannot play says go');
  const seat = state.toPlay;
  const said: GameState = { ...state, go: state.go.map((g, s) => g || s === seat), scored: null };
  return canPlay(said, other(seat)) ? { ...said, toPlay: other(seat) } : endCount(said, []);
}

/**
 * The cards of a finished count are turned over and the count starts again from 0, led by the player who did not
 * play the last card (if they have any left). Once every card has been played, the hands are shown.
 */
export function collect(state: GameState): GameState {
  if (state.phase !== 'collecting') throw new Error('No count to collect');
  const reset: GameState = { ...state, pile: [], count: 0, go: [false, false], lastPlayer: -1, scored: null };
  if (state.players.every((p) => p.hand.length === 0)) return show(reset);
  const leader = hasCards(state, other(state.lastPlayer)) ? other(state.lastPlayer) : state.lastPlayer;
  return { ...reset, phase: 'pegging', toPlay: leader };
}

/** The hands counted in the show, in order: the non-dealer's, the dealer's, then the dealer's crib. */
function showing(state: GameState, step: number): Show {
  const seat = step === 0 ? other(state.dealer) : state.dealer;
  const crib = step === 2;
  const cards = crib ? sortHand(state.crib) : state.players[seat]!.kept;
  return { seat, crib, cards, count: countHand(cards, state.starter!, crib) };
}

/** Counts the next hand in the show and pegs it. The crib is last, and ends the hand. */
function show(state: GameState): GameState {
  const shown = showing(state, state.shows.length);
  const counted = peg(
    { ...state, phase: 'showing', toPlay: -1, shows: [...state.shows, shown], scored: null },
    shown.seat,
    shown.count.total,
    shown.crib ? 'crib' : 'hand',
  );
  return counted.phase !== 'settled' && shown.crib ? settle(counted) : counted;
}

/** On to the next count in the show: the dealer's hand, then the crib. */
export function showNext(state: GameState): GameState {
  if (state.phase !== 'showing') throw new Error('Not counting hands now');
  return show(state);
}

/** It is the computer player's turn in the play. */
export const isBotTurn = (state: GameState): boolean => state.phase === 'pegging' && state.toPlay === BOT_SEAT;

/** The hand being counted in the show (or the last one counted), if any. */
export const currentShow = (state: GameState): Show | undefined => state.shows.at(-1);

/** A player's points in one hand: the play, their hand and their crib. */
export const handTotal = (tally: Tally): number => tally.pegging + tally.hand + tally.crib;
