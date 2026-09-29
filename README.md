# Blackjack

A free, single-player blackjack game against the dealer, played entirely in the browser.
Planned address: https://blackjack.matt-rarely-writes.co.uk

Not gambling: there is no real money, and chips have no value. Nothing about visitors is stored,
there is no login, and no advertising. The site is funded by a Ko-fi "Support me" button.

## Rules

- Start with 100 chips; bet 1-20 chips per hand. At 0 chips the game is over and can be restarted.
- Six decks (312 cards), reshuffled before the next hand once 52 or fewer cards are left.
- The player gets two cards and the dealer one; the dealer's next cards come after the player finishes (no hidden card).
- Blackjack (Ace + 10-value card) pays 3:2; a win pays 1:1; a tie is a push and the bet is returned.
- Dealer hits to 17 and stands on all 17s, including soft 17.
- Player options: hit, stand, double down, split, surrender.
  - Double down: double the bet and take exactly one card; allowed on any two-card hand (including after a split) if you have the chips.
  - Split: two cards of the same rank (K+Q is not a pair), needs chips for the extra bet, up to 4 hands in total.
  - Split aces get one card each, cannot be re-split and cannot double.
  - A two-card 21 after a split counts as blackjack (3:2).
  - Surrender: only as the first decision on the first two cards (never after a split); returns half the bet, rounded down, so it needs a bet of 2 or more. The dealer has no hidden card, so this is decided before the dealer's blackjack is known.
- Insurance: offered when the dealer's card is an ace, before the player acts (even with a player blackjack). It costs half the bet, rounded down (so a bet of 1 cannot be insured, and the chips must be available), and pays 2:1 if the dealer's next card gives them blackjack. It is settled when the dealer draws their second card; if insurance was taken the dealer always draws it, even after a bust or surrender.
- Refreshing the page restarts the game.

## Credits

- Card artwork: Byron Knoll's vector playing cards, released into the public domain
  (https://commons.wikimedia.org/wiki/Category:Playing_cards_set_by_Byron_Knoll). They are converted to small
  WebP images by `scripts/build-cards.mjs` (see the comments at the top for how to rebuild them).
- Card and chip sounds: recordings from Kenney's Casino Audio pack (https://kenney.nl/assets/casino-audio), released under
  Creative Commons Zero. The win, lose and blackjack jingles are synthesised in the browser.
- Fonts: Figtree, Young Serif and DM Sans, under the SIL Open Font License (see `src/fonts/README.md`).

## Look and feel

The site is styled to match Brand New (https://brand-new.matt-rarely-writes.co.uk): the same slate colours, terracotta
accent, fonts, pill navigation, flat pill buttons and floating "Support me" button. The colours are tokens in
`src/app.css`, including the table's own felt, walnut and gold. The menu has Game, How to play and About; they are
real addresses (`/`, `/how-to-play`, `/about`) that the host serves the same page for, so the game keeps running while
you read the rules.
