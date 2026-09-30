# Blackjack

A free, single-player blackjack game against the dealer, played entirely in the browser.
Play it at https://blackjack.matt-rarely-writes.co.uk. Part of the card-games repository: see the README at
the root for how the games are put together.

Not gambling: there is no real money, and chips have no value. Nothing about visitors is stored,
there is no login, and no advertising. The site is funded by a Ko-fi "Support me" button.

## Rules

- Start with 100 chips; bet 1-20 chips per hand. At 0 chips the game is over and can be restarted.
- Six decks (312 cards), reshuffled before the next hand once 52 or fewer cards are left.
- The player gets two cards and the dealer one; the dealer's next cards come after the player finishes (no hidden card).
- Blackjack (Ace + 10-value card) pays 3:2; a win pays 1:1; a tie is a push and the bet is returned.
- Dealer hits to 17 and stands on all 17s, including soft 17.
- Player options: hit, stand, double down, split, surrender.
  - Double down: double the bet and take exactly one card, then the hand stands; allowed on any two-card hand (including after a split) if you have the chips. The 20-chip maximum applies to the bet placed, so a doubled bet can go above it.
  - Split: two cards of the same rank (K+Q is not a pair), needs chips for the extra bet, up to 4 hands in total.
  - Split aces get one card each, cannot be re-split and cannot double.
  - A two-card 21 after a split counts as blackjack (3:2).
  - Surrender: only as the first decision on the first two cards (never after a split); returns half the bet, rounded down, so it needs a bet of 2 or more. The dealer has no hidden card, so this is decided before the dealer's blackjack is known.
- Insurance: offered when the dealer's card is an ace, before the player acts (even with a player blackjack). It costs half the bet, rounded down (so a bet of 1 cannot be insured, and the chips must be available), and pays 2:1 if the dealer's next card gives them blackjack. It is settled when the dealer draws their second card; if insurance was taken the dealer always draws it, even after a bust or surrender.
- Refreshing the page restarts the game.

## Structure

- `src/engine/` - the rules, with no UI: `game.ts` (dealing, player choices, the dealer, settlement) and `hand.ts`
  (hand values). Everything is immutable: `act(state, action)` returns the next state.
- `src/lib/` - the Svelte components, sounds (`cues.ts` decides which sound goes with a change of state) and timing (`motion.ts`).
- `src/App.svelte` - holds the game state.
- `e2e/` - browser tests in WebKit: a round is dealt face up and played to the end with nothing blocked by the security
  headers, and nothing on the table overlaps at five screen sizes.

## Commands

From this folder (or from the root with `-w apps/blackjack`):

```
npm run dev      # start the dev server
npm test         # run the tests
npm run check    # type-check
npm run build    # production build in dist/
npm run e2e      # browser tests in WebKit
```

## Credits, look and feel

The card artwork, sounds, fonts, colours and the page around the game are shared by all the games and live in
`packages/card-kit`; see the README at the root of the repository for what they are and where they come from.
