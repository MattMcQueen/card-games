import { DECKS, MAX_BET, MAX_HANDS, MIN_BET, RESHUFFLE_AT, STARTING_CHIPS } from './constants';
import { handValue, isBlackjack, isBust, isPair } from './hand';
import { createShoe, secureRandomInt, shuffle, type RandomInt } from './shoe';
import type { Action, Card, GameState, HandResult, PlayerHand } from './types';

export function newGame(randomInt: RandomInt = secureRandomInt): GameState {
  return {
    phase: 'betting',
    chips: STARTING_CHIPS,
    shoe: shuffle(createShoe(DECKS), randomInt),
    shuffled: true,
    hands: [],
    active: 0,
    dealer: [],
    results: [],
  };
}

/** The game is over once the player has no chips left and no bet is in play. */
export function isGameOver(state: GameState): boolean {
  return state.phase !== 'player' && state.chips < MIN_BET;
}

/** The biggest bet the player may place right now. */
export function maxBet(state: GameState): number {
  return Math.min(MAX_BET, state.chips);
}

function draw(shoe: readonly Card[]): [Card, readonly Card[]] {
  const card = shoe[0];
  if (!card) throw new Error('The shoe is empty');
  return [card, shoe.slice(1)];
}

/** Places the bet and deals: player, dealer, player. The dealer's next cards come later. */
export function startRound(
  state: GameState,
  bet: number,
  randomInt: RandomInt = secureRandomInt,
): GameState {
  if (state.phase !== 'betting') throw new Error('A round is already in progress');
  if (!Number.isInteger(bet) || bet < MIN_BET || bet > maxBet(state)) {
    throw new RangeError(`Bet must be a whole number from ${MIN_BET} to ${maxBet(state)}`);
  }

  const shuffled = state.shoe.length <= RESHUFFLE_AT;
  let shoe: readonly Card[] = shuffled ? shuffle(createShoe(DECKS), randomInt) : state.shoe;
  let first: Card, up: Card, second: Card;
  [first, shoe] = draw(shoe);
  [up, shoe] = draw(shoe);
  [second, shoe] = draw(shoe);

  const cards = [first, second];
  const hand: PlayerHand = {
    cards,
    bet,
    doubled: false,
    fromSplit: false,
    done: isBlackjack(cards),
  };

  return advance({
    phase: 'player',
    chips: state.chips - bet,
    shoe,
    shuffled,
    hands: [hand],
    active: 0,
    dealer: [up],
    results: [],
  });
}

export function legalActions(state: GameState): Action[] {
  if (state.phase !== 'player') return [];
  const hand = state.hands[state.active];
  if (!hand || hand.done) return [];

  const actions: Action[] = ['hit', 'stand'];
  const canAfford = state.chips >= hand.bet;
  if (hand.cards.length === 2 && canAfford) actions.push('double');
  if (isPair(hand.cards) && canAfford && state.hands.length < MAX_HANDS) actions.push('split');
  return actions;
}

export function act(state: GameState, action: Action): GameState {
  if (!legalActions(state).includes(action)) {
    throw new Error(`"${action}" is not allowed right now`);
  }
  const index = state.active;
  const hand = state.hands[index] as PlayerHand;

  switch (action) {
    case 'hit': {
      const [card, shoe] = draw(state.shoe);
      const cards = [...hand.cards, card];
      const done = handValue(cards).total >= 21;
      return advance({ ...state, shoe, hands: replaceHand(state, index, { ...hand, cards, done }) });
    }
    case 'stand':
      return advance({ ...state, hands: replaceHand(state, index, { ...hand, done: true }) });
    case 'double': {
      const [card, shoe] = draw(state.shoe);
      const doubled: PlayerHand = {
        ...hand,
        cards: [...hand.cards, card],
        bet: hand.bet * 2,
        doubled: true,
        done: true,
      };
      return advance({
        ...state,
        chips: state.chips - hand.bet,
        shoe,
        hands: replaceHand(state, index, doubled),
      });
    }
    case 'split': {
      const [leftCard, rightCard] = hand.cards as [Card, Card];
      const splitAces = leftCard.rank === 'A';
      let shoe = state.shoe;
      let leftDraw: Card, rightDraw: Card;
      [leftDraw, shoe] = draw(shoe);
      [rightDraw, shoe] = draw(shoe);

      const make = (kept: Card, drawn: Card): PlayerHand => {
        const cards = [kept, drawn];
        return {
          cards,
          bet: hand.bet,
          doubled: false,
          fromSplit: true,
          // Split aces get one card only; other hands stop at 21.
          done: splitAces || handValue(cards).total === 21,
        };
      };
      const hands = [...state.hands];
      hands.splice(index, 1, make(leftCard, leftDraw), make(rightCard, rightDraw));
      return advance({ ...state, chips: state.chips - hand.bet, shoe, hands });
    }
  }
}

/** Moves on to the next hand still to play, or finishes the round when there is none. */
function advance(state: GameState): GameState {
  const next = state.hands.findIndex((hand) => !hand.done);
  if (next === -1) return finishRound(state);
  return { ...state, active: next };
}

function replaceHand(state: GameState, index: number, hand: PlayerHand): PlayerHand[] {
  return state.hands.map((existing, i) => (i === index ? hand : existing));
}

/** The dealer plays out (hits to 17, stands on every 17) and every hand is settled. */
function finishRound(state: GameState): GameState {
  let shoe = state.shoe;
  const dealer = [...state.dealer];

  // If every hand busted the dealer has nothing to beat and does not draw.
  if (state.hands.some((hand) => !isBust(hand.cards))) {
    while (handValue(dealer).total < 17) {
      let card: Card;
      [card, shoe] = draw(shoe);
      dealer.push(card);
    }
  }

  const results = state.hands.map((hand) => settleHand(hand, dealer));
  const returned = results.reduce((sum, result) => sum + result.returned, 0);
  return {
    ...state,
    phase: 'settled',
    chips: state.chips + returned,
    shoe,
    dealer,
    results,
  };
}

function settleHand(hand: PlayerHand, dealer: readonly Card[]): HandResult {
  const result = (outcome: HandResult['outcome'], returned: number): HandResult => ({
    outcome,
    bet: hand.bet,
    returned,
    net: returned - hand.bet,
  });

  if (isBust(hand.cards)) return result('bust', 0);

  const dealerBlackjack = isBlackjack(dealer);
  if (isBlackjack(hand.cards)) {
    // Blackjack pays 3:2; odd bets round the winnings down (5 wins 7).
    return dealerBlackjack
      ? result('push', hand.bet)
      : result('blackjack', hand.bet + Math.floor((hand.bet * 3) / 2));
  }
  if (dealerBlackjack) return result('lose', 0);

  const player = handValue(hand.cards).total;
  const dealerTotal = handValue(dealer).total;
  if (dealerTotal > 21 || player > dealerTotal) return result('win', hand.bet * 2);
  if (player === dealerTotal) return result('push', hand.bet);
  return result('lose', 0);
}

/** Back to the betting screen after a round has been settled. */
export function nextRound(state: GameState): GameState {
  if (state.phase !== 'settled') throw new Error('The round is not finished');
  return { ...state, phase: 'betting', hands: [], active: 0, dealer: [], results: [] };
}
