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
- Player options: hit, stand, double down, split. No insurance, no surrender.
  - Double down: double the bet and take exactly one card; allowed on any two-card hand (including after a split) if you have the chips.
  - Split: two cards of the same rank (K+Q is not a pair), needs chips for the extra bet, up to 4 hands in total.
  - Split aces get one card each, cannot be re-split and cannot double.
  - A two-card 21 after a split counts as blackjack (3:2).
- Refreshing the page restarts the game.
