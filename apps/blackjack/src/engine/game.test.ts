import { seededRandomInt } from '@card-games/cards-core';
import { describe, expect, it } from 'vitest';
import {
  act,
  insuranceCost,
  isGameOver,
  legalActions,
  maxBet,
  newGame,
  nextRound,
  startRound,
  surrenderRefund,
} from './game';
import { handValue } from './hand';
import { rigged } from './testing';
import type { Action, GameState, Rank } from './types';

const ranks = (state: GameState, hand = 0) => state.hands[hand]?.cards.map((c) => c.rank);

/**
 * Plays a whole round with a fixed list of actions after the deal. If the dealer shows an ace,
 * insurance is turned down first unless the list starts with 'insure' or 'decline'.
 */
function play(state: GameState, bet: number, ...actions: Action[]): GameState {
  let current = startRound(state, bet);
  if (current.phase === 'insurance' && actions[0] !== 'insure' && actions[0] !== 'decline') {
    current = act(current, 'decline');
  }
  for (const action of actions) current = act(current, action);
  return current;
}

describe('newGame', () => {
  it('starts with 100 chips, a full six-deck shoe and the betting screen', () => {
    const game = newGame(seededRandomInt(3));
    expect(game.phase).toBe('betting');
    expect(game.chips).toBe(100);
    expect(game.shoe).toHaveLength(312);
    expect(isGameOver(game)).toBe(false);
  });
});

describe('placing a bet', () => {
  const game = newGame(seededRandomInt(3));

  it('accepts 1 to 20 whole chips', () => {
    expect(() => startRound(game, 1)).not.toThrow();
    expect(() => startRound(game, 20)).not.toThrow();
  });

  it('rejects zero, over 20, negative and fractional bets', () => {
    for (const bet of [0, 21, -5, 2.5, Number.NaN]) {
      expect(() => startRound(game, bet)).toThrow(RangeError);
    }
  });

  it('cannot bet more chips than the player has', () => {
    const poor = rigged(['2', '2', '2'], 7);
    expect(maxBet(poor)).toBe(7);
    expect(() => startRound(poor, 8)).toThrow(RangeError);
    expect(() => startRound(poor, 7)).not.toThrow();
  });

  it('cannot start a round while one is in progress', () => {
    const started = startRound(rigged(['9', '6', '8']), 10);
    expect(() => startRound(started, 10)).toThrow();
  });
});

describe('the deal', () => {
  it('deals player, dealer, player, taking the bet from the chips', () => {
    const state = startRound(rigged(['9', '6', '8']), 10);
    expect(state.phase).toBe('player');
    expect(ranks(state)).toEqual(['9', '8']);
    expect(state.dealer.map((c) => c.rank)).toEqual(['6']);
    expect(state.chips).toBe(90);
    expect(legalActions(state)).toEqual(['hit', 'stand', 'double', 'surrender']);
  });
});

describe('reshuffling', () => {
  const base = newGame(seededRandomInt(3));

  it('does not reshuffle while more than 52 cards remain', () => {
    const state = startRound({ ...base, shoe: base.shoe.slice(0, 53) }, 5, seededRandomInt(1));
    expect(state.shuffled).toBe(false);
    expect(state.shoe).toHaveLength(50);
  });

  it('reshuffles all six decks before the deal when 52 or fewer remain', () => {
    const state = startRound({ ...base, shoe: base.shoe.slice(0, 52) }, 5, seededRandomInt(1));
    expect(state.shuffled).toBe(true);
    expect(state.shoe.length + state.hands.length * 2 + state.dealer.length).toBe(312);
  });
});

describe('blackjack', () => {
  it('pays 3:2 and ends the round straight away', () => {
    const state = startRound(rigged(['A', '9', 'K', '8']), 10);
    expect(state.phase).toBe('settled');
    expect(state.results[0]).toMatchObject({ outcome: 'blackjack', returned: 25, net: 15 });
    expect(state.chips).toBe(115);
  });

  it('rounds the winnings down on an odd bet: 5 wins 7', () => {
    const state = startRound(rigged(['A', '9', 'K', '8']), 5);
    expect(state.results[0]).toMatchObject({ outcome: 'blackjack', returned: 12, net: 7 });
    expect(state.chips).toBe(107);
  });

  it('is a push when the dealer also has blackjack', () => {
    const state = play(rigged(['A', 'A', 'K', 'K']), 10);
    expect(state.results[0]).toMatchObject({ outcome: 'push', returned: 10, net: 0 });
    expect(state.chips).toBe(100);
  });

  it('beats a dealer 21 made of three cards', () => {
    const state = startRound(rigged(['A', '7', 'K', '4', '10']), 10);
    // dealer: 7 + 4 = 11, then 10 = 21 in three cards
    expect(state.dealer).toHaveLength(3);
    expect(state.results[0]?.outcome).toBe('blackjack');
  });

  it('loses to a dealer blackjack when the player has a three-card 21', () => {
    // player 7, 7, then hits a 7 for 21; dealer A then K.
    const state = play(rigged(['7', 'A', '7', '7', 'K']), 10, 'decline', 'hit');
    expect(handValue(state.hands[0]!.cards).total).toBe(21);
    expect(state.results[0]).toMatchObject({ outcome: 'lose', returned: 0 });
    expect(state.chips).toBe(90);
  });
});

describe('dealer play', () => {
  it('stands on soft 17', () => {
    const state = play(rigged(['10', 'A', '9', '6']), 10, 'stand');
    expect(state.dealer.map((c) => c.rank)).toEqual(['A', '6']);
    expect(state.results[0]?.outcome).toBe('win');
    expect(state.chips).toBe(110);
  });

  it('hits on 16 and can bust', () => {
    const state = play(rigged(['10', '10', '8', '6', 'K']), 10, 'stand');
    expect(state.dealer.map((c) => c.rank)).toEqual(['10', '6', 'K']);
    expect(state.results[0]?.outcome).toBe('win');
  });

  it('draws nothing when every player hand has busted', () => {
    const state = play(rigged(['10', '9', '6', 'K']), 10, 'hit');
    expect(state.results[0]).toMatchObject({ outcome: 'bust', returned: 0 });
    expect(state.dealer).toHaveLength(1);
    expect(state.chips).toBe(90);
  });
});

describe('results', () => {
  it('pays even money for a win, returns the bet on a push, loses otherwise', () => {
    expect(play(rigged(['10', '10', '9', '7']), 10, 'stand').chips).toBe(110);
    expect(play(rigged(['10', '10', '9', '9']), 10, 'stand').chips).toBe(100);
    expect(play(rigged(['10', '10', '7', '9']), 10, 'stand').chips).toBe(90);
  });

  it('a three-card 21 beats a dealer 18 and pays only 1:1', () => {
    const state = play(rigged(['7', '10', '7', '7']), 10, 'hit');
    expect(state.results[0]).toMatchObject({ outcome: 'win', returned: 20 });
  });
});

describe('hitting', () => {
  it('stands automatically on 21 and ends the round', () => {
    const state = play(rigged(['5', '10', '6', '10']), 10, 'hit');
    expect(state.phase).toBe('settled');
    expect(legalActions(state)).toEqual([]);
  });

  it('offers only hit and stand once a third card is drawn', () => {
    const state = play(rigged(['2', '10', '3', '2']), 10, 'hit');
    expect(legalActions(state)).toEqual(['hit', 'stand']);
  });
});

describe('double down', () => {
  it('doubles the bet, takes exactly one card and ends the hand', () => {
    const state = play(rigged(['5', '10', '6', 'K']), 10, 'double');
    expect(state.hands[0]).toMatchObject({ bet: 20, doubled: true, done: true });
    expect(ranks(state)).toEqual(['5', '6', 'K']);
    expect(state.results[0]).toMatchObject({ bet: 20, returned: 40 });
    expect(state.chips).toBe(120);
  });

  it('loses the doubled bet when it fails', () => {
    const state = play(rigged(['5', '10', '6', '2']), 10, 'double');
    expect(state.results[0]).toMatchObject({ outcome: 'lose', bet: 20, net: -20 });
    expect(state.chips).toBe(80);
  });

  it('gives a doubled hand no more cards, even on a low total', () => {
    const state = play(rigged(['2', '10', '3', '2']), 10, 'double'); // 2 + 3 + 2 = 7
    expect(ranks(state)).toEqual(['2', '3', '2']);
    expect(state.hands[0]?.done).toBe(true);
    expect(legalActions(state)).toEqual([]);
    expect(() => act(state, 'hit')).toThrow();
    expect(() => act(state, 'double')).toThrow();
  });

  it('gives a doubled split hand one card and moves on, leaving it alone afterwards', () => {
    const split = play(rigged(['8', '6', '8', '3', '2', '4']), 10, 'split');
    const doubled = act(split, 'double');
    expect(ranks(doubled, 0)).toEqual(['8', '3', '4']);
    expect(doubled.hands[0]).toMatchObject({ bet: 20, doubled: true, done: true });
    expect(doubled.active).toBe(1);
    const next = act(doubled, 'hit');
    expect(ranks(next, 0)).toEqual(['8', '3', '4']); // still just the one extra card
    expect(ranks(next, 1)).toHaveLength(3);
  });

  it('is not offered without chips for the extra bet', () => {
    const state = startRound(rigged(['5', '10', '6'], 15), 10);
    expect(state.chips).toBe(5);
    expect(legalActions(state)).toEqual(['hit', 'stand', 'surrender']);
    expect(() => act(state, 'double')).toThrow();
  });
});

describe('splitting', () => {
  it('splits a pair into two hands, each with a new card and its own bet', () => {
    const state = play(rigged(['8', '6', '8', '3', 'K']), 10, 'split');
    expect(state.hands).toHaveLength(2);
    expect(ranks(state, 0)).toEqual(['8', '3']);
    expect(ranks(state, 1)).toEqual(['8', 'K']);
    expect(state.chips).toBe(80);
    expect(state.active).toBe(0);
  });

  it('needs the same rank: K and Q is not a pair, K and K is', () => {
    expect(legalActions(startRound(rigged(['K', '6', 'Q']), 10))).not.toContain('split');
    expect(legalActions(startRound(rigged(['K', '6', 'K']), 10))).toContain('split');
  });

  it('is not offered without chips for the second bet', () => {
    const state = startRound(rigged(['8', '6', '8'], 15), 10);
    expect(legalActions(state)).not.toContain('split');
    expect(() => act(state, 'split')).toThrow();
  });

  it('gives split aces one card each, with no further action', () => {
    const state = play(rigged(['A', '6', 'A', '5', '9']), 10, 'split');
    expect(state.hands.every((h) => h.done && h.fromSplit)).toBe(true);
    expect(state.phase).toBe('settled');
    // A+5 = soft 16 loses to the dealer's 18, A+9 = soft 20 wins.
    expect(state.results.map((r) => r.outcome)).toEqual(['lose', 'win']);
    expect(state.chips).toBe(100);
  });

  it('cannot re-split or double split aces, even when they draw another ace', () => {
    const state = play(rigged(['A', '6', 'A', 'A', 'A']), 10, 'split');
    expect(state.hands).toHaveLength(2);
    expect(state.hands.map((h) => h.done)).toEqual([true, true]);
    expect(legalActions(state)).toEqual([]);
  });

  it('counts a two-card 21 after a split as blackjack, paying 3:2', () => {
    const state = play(rigged(['A', '6', 'A', 'K', 'K']), 10, 'split');
    expect(state.results.map((r) => r.outcome)).toEqual(['blackjack', 'blackjack']);
    expect(state.chips).toBe(130);
  });

  it('lets a non-ace split hand stop at 21 automatically', () => {
    const state = play(rigged(['9', '6', '9', '2', '10']), 10, 'split');
    // hand one is 9+2, hand two 9+10 = 19; nothing is automatic here
    expect(state.hands.map((h) => h.done)).toEqual([false, false]);
    const rigged21 = play(rigged(['10', '6', '10', 'A', '3']), 10, 'split');
    // 10+A is a two-card 21 so hand one is finished; hand two (10+3) is still to play
    expect(rigged21.hands.map((h) => h.done)).toEqual([true, false]);
    expect(rigged21.active).toBe(1);
  });

  it('lets any split hand double down', () => {
    const state = play(rigged(['8', '6', '8', '3', '2', 'K']), 10, 'split', 'double', 'stand');
    // 8+3 doubled with a K = 21 (bet 20); 8+2 = 10 loses to the dealer's 18.
    expect(state.hands[0]).toMatchObject({ bet: 20, doubled: true });
    expect(state.results.map((r) => r.outcome)).toEqual(['win', 'lose']);
    expect(state.chips).toBe(110);
  });

  it('allows at most four hands', () => {
    const state = play(
      rigged(['8', '6', '8', '8', '8', '8', '8', '8', '8']),
      10,
      'split',
      'split',
      'split',
    );
    expect(state.hands).toHaveLength(4);
    expect(state.chips).toBe(60);
    expect(legalActions(state)).not.toContain('split');
    expect(() => act(state, 'split')).toThrow();
  });
});

describe('insurance', () => {
  // player 9, dealer A, player 8, then the dealer's next cards
  const deal = (next: Rank[], chips = 100) => rigged(['9', 'A', '8', ...next], chips);

  it('is offered when the dealer shows an ace, before anything else', () => {
    const state = startRound(deal(['K']), 10);
    expect(state.phase).toBe('insurance');
    expect(legalActions(state)).toEqual(['insure', 'decline']);
    expect(state.chips).toBe(90);
    expect(isGameOver(state)).toBe(false);
  });

  it('is not offered for other dealer cards, including ten-value cards', () => {
    expect(startRound(rigged(['9', 'K', '8']), 10).phase).toBe('player');
    expect(startRound(rigged(['9', '10', '8']), 10).phase).toBe('player');
  });

  it('costs half the bet, rounded down, so a bet of 1 cannot be insured', () => {
    expect(insuranceCost(10)).toBe(5);
    expect(insuranceCost(5)).toBe(2);
    expect(insuranceCost(1)).toBe(0);
    expect(startRound(deal(['K']), 1).phase).toBe('player');
    expect(startRound(deal(['K']), 2).phase).toBe('insurance');
  });

  it('is not offered when the player cannot afford it', () => {
    expect(startRound(deal(['K'], 12), 10).phase).toBe('player'); // 2 chips left, insurance is 5
    expect(startRound(deal(['K'], 15), 10).phase).toBe('insurance');
  });

  it('takes the stake and then plays on as normal', () => {
    const state = act(startRound(deal(['K']), 10), 'insure');
    expect(state.phase).toBe('player');
    expect(state.insurance).toBe(5);
    expect(state.chips).toBe(85);
    expect(legalActions(state)).toEqual(['hit', 'stand', 'double', 'surrender']);
  });

  it('pays 2 to 1 when the dealer makes blackjack, which cancels out the lost hand', () => {
    const state = play(deal(['K']), 10, 'insure', 'stand');
    expect(state.dealer.map((c) => c.rank)).toEqual(['A', 'K']);
    expect(state.results[0]).toMatchObject({ outcome: 'lose', returned: 0 });
    expect(state.insuranceReturned).toBe(15);
    expect(state.chips).toBe(100);
  });

  it('is lost when the dealer does not make blackjack', () => {
    // dealer A + 6 = soft 17 and stands; the player's 17 pushes
    const state = play(deal(['6']), 10, 'insure', 'stand');
    expect(state.insuranceReturned).toBe(0);
    expect(state.results[0]?.outcome).toBe('push');
    expect(state.chips).toBe(95);
  });

  it('can be turned down, which changes nothing else', () => {
    const state = play(deal(['K']), 10, 'decline', 'stand');
    expect(state.insurance).toBe(0);
    expect(state.chips).toBe(90);
  });

  it('pays 2 chips for a bet of 5 (stake 2), returning 6', () => {
    const state = play(deal(['K']), 5, 'insure', 'stand');
    expect(state.insurance).toBe(2);
    expect(state.insuranceReturned).toBe(6);
    expect(state.chips).toBe(100 - 5 - 2 + 6);
  });

  it('makes a player blackjack pay even money when the dealer has blackjack', () => {
    const state = play(rigged(['A', 'A', 'K', 'K']), 10, 'insure');
    expect(state.phase).toBe('settled');
    expect(state.results[0]?.outcome).toBe('push');
    expect(state.chips).toBe(110); // the bet back, plus 2 to 1 on the 5 staked
  });

  it('still pays a player blackjack 3:2 when the dealer has none', () => {
    // dealer A, 5 (soft 16), then a K makes 16, then filler 2s take it to 18
    const state = play(rigged(['A', 'A', 'K', '5', 'K']), 10, 'insure');
    expect(state.results[0]?.outcome).toBe('blackjack');
    expect(state.chips).toBe(100 - 10 - 5 + 25);
  });

  it('makes the dealer draw a second card even when every hand has busted', () => {
    const state = play(rigged(['10', 'A', '6', 'K', 'K']), 10, 'insure', 'hit');
    expect(state.results[0]?.outcome).toBe('bust');
    expect(state.dealer.map((c) => c.rank)).toEqual(['A', 'K']);
    expect(state.insuranceReturned).toBe(15);
    expect(state.chips).toBe(100 - 10 - 5 + 15);
  });

  it('cannot be answered outside the insurance step', () => {
    expect(() => act(startRound(rigged(['9', '6', '8']), 10), 'insure')).toThrow();
    const asked = startRound(deal(['K']), 10);
    expect(() => act(asked, 'hit')).toThrow();
    expect(() => act(asked, 'surrender')).toThrow();
  });
});

describe('surrender', () => {
  it('gives half the bet back and ends the round', () => {
    const state = play(rigged(['10', '6', '6']), 10, 'surrender');
    expect(state.phase).toBe('settled');
    expect(state.results[0]).toMatchObject({ outcome: 'surrender', returned: 5, net: -5 });
    expect(state.chips).toBe(95);
    expect(state.dealer).toHaveLength(1); // the dealer has nothing to beat and draws nothing
  });

  it('rounds the refund down: 5 gets back 2', () => {
    expect(surrenderRefund(5)).toBe(2);
    expect(play(rigged(['10', '6', '6']), 5, 'surrender').chips).toBe(97);
  });

  it('is not offered on a bet of 1, where half would be nothing', () => {
    expect(legalActions(startRound(rigged(['10', '6', '6']), 1))).not.toContain('surrender');
    expect(legalActions(startRound(rigged(['10', '6', '6']), 2))).toContain('surrender');
  });

  it('is only offered as the first decision', () => {
    const hit = play(rigged(['2', '10', '3', '2']), 10, 'hit');
    expect(legalActions(hit)).not.toContain('surrender');
    expect(() => act(hit, 'surrender')).toThrow();
  });

  it('is never offered after a split', () => {
    const split = play(rigged(['8', '6', '8', '3', '2']), 10, 'split');
    expect(legalActions(split)).not.toContain('surrender');
  });

  it('is not offered with a blackjack, which has already won', () => {
    expect(() => play(rigged(['A', '9', 'K', '8']), 10, 'surrender')).toThrow();
  });

  it('is not offered after doubling', () => {
    const doubled = play(rigged(['5', '10', '6', '2']), 10, 'double');
    expect(legalActions(doubled)).toEqual([]);
  });

  it('is still allowed after taking insurance, which is settled as usual', () => {
    // dealer A then K: blackjack, so the insurance pays 15 while the surrendered hand gets 5 back
    const state = play(rigged(['9', 'A', '8', 'K']), 10, 'insure', 'surrender');
    expect(state.results[0]?.outcome).toBe('surrender');
    expect(state.dealer.map((c) => c.rank)).toEqual(['A', 'K']);
    expect(state.chips).toBe(100 - 10 - 5 + 5 + 15);
  });

  it('does not let a dealer blackjack take a surrendered hand', () => {
    const state = play(rigged(['9', 'A', '8', 'K']), 10, 'decline', 'surrender');
    expect(state.results[0]).toMatchObject({ outcome: 'surrender', returned: 5 });
    expect(state.chips).toBe(95);
  });
});

describe('after the round', () => {
  it('nextRound returns to betting and clears the table', () => {
    const settled = play(rigged(['10', '10', '9', '7']), 10, 'stand');
    const next = nextRound(settled);
    expect(next.phase).toBe('betting');
    expect(next.hands).toEqual([]);
    expect(next.dealer).toEqual([]);
    expect(next.chips).toBe(110);
  });

  it('cannot skip ahead before the round is settled', () => {
    expect(() => nextRound(startRound(rigged(['9', '6', '8']), 10))).toThrow();
  });

  it('rejects actions outside the player phase', () => {
    const settled = play(rigged(['10', '10', '9', '7']), 10, 'stand');
    expect(legalActions(settled)).toEqual([]);
    expect(() => act(settled, 'hit')).toThrow();
  });
});

describe('game over', () => {
  it('happens at zero chips after the final hand, and a new game restores 100', () => {
    const lost = play(rigged(['10', '10', '7', '9'], 10), 10, 'stand');
    expect(lost.chips).toBe(0);
    expect(isGameOver(lost)).toBe(true);
    expect(isGameOver(nextRound(lost))).toBe(true);
    expect(() => startRound(nextRound(lost), 1)).toThrow(RangeError);
    expect(newGame(seededRandomInt(1)).chips).toBe(100);
  });

  it('is not triggered while a bet is on the table, even with no chips left', () => {
    const state = startRound(rigged(['10', '10', '7'], 10), 10);
    expect(state.chips).toBe(0);
    expect(isGameOver(state)).toBe(false);
  });
});

describe('random play', () => {
  it('never breaks chip or card accounting over thousands of rounds', () => {
    let rounds = 0;
    for (const seed of [11, 22, 33, 44]) {
      const random = seededRandomInt(seed);
      let state = newGame(random);
      for (let i = 0; i < 1500; i++) {
        if (isGameOver(state)) state = newGame(random);

        const chipsBefore = state.chips;
        const shoeBefore = state.shoe.length <= 52 ? 312 : state.shoe.length;
        state = startRound(state, 1 + random(maxBet(state)), random);

        while (state.phase === 'player' || state.phase === 'insurance') {
          const actions = legalActions(state);
          expect(actions.length).toBeGreaterThan(0);
          state = act(state, actions[random(actions.length)] as Action);
          expect(state.hands.length).toBeLessThanOrEqual(4);
          expect(Number.isInteger(state.chips) && state.chips >= 0).toBe(true);
        }

        // Every card is still somewhere: what is left in the shoe plus what is on the table.
        const onTable = state.hands.reduce((n, h) => n + h.cards.length, 0) + state.dealer.length;
        expect(state.shoe.length + onTable).toBe(shoeBefore);

        const net =
          state.results.reduce((sum, r) => sum + r.net, 0) + state.insuranceReturned - state.insurance;
        expect(state.chips).toBe(chipsBefore + net);
        expect(state.results).toHaveLength(state.hands.length);
        state.results.forEach((r, k) => expect(r.bet).toBe(state.hands[k]!.bet));
        expect(state.hands.every((h) => h.done)).toBe(true);
        expect(Number.isInteger(state.chips) && state.chips >= 0).toBe(true);

        state = nextRound(state);
        rounds++;
      }
    }
    expect(rounds).toBe(6000);
  });
});
