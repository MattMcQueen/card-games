# Bridge

A free, single-player game of rubber bridge: you and a computer partner against two computer players, played
entirely in the browser.

No money is involved. There are no cookies, no login and no advertising. The site is funded by a Ko-fi "Support me"
button. (It does not count visits yet: it needs its own Cloudflare Web Analytics site and token in `src/main.ts`.)

Built from the same pieces as the other games (Svelte 5, Vite, TypeScript, a pure and well-tested rules engine, no
backend), in the card-games repository: see the README at the root for how the games are put together.

## Rules

Rubber bridge, as at https://officialgamerules.org/game-rules/bridge/, with the standard scores where that page gives
none.

- Four players in two partnerships, partners facing: you (seat 0, South) and Helen across (seat 2, North), against
  Arjun on your left (seat 1, West) and Mei on your right (seat 3, East). Calls and cards go to the left (clockwise).
- Each hand uses a fresh, cryptographically shuffled 52-card deck, dealt one card at a time from the dealer's left,
  thirteen each. Aces are high. You deal the first hand, and the deal passes to the left.
- The auction starts with the dealer. A bid names a number of tricks over six (1 to 7) and a strain, ranked clubs,
  diamonds, hearts, spades, no trumps; each bid must be higher than the last. A player may instead pass, double the
  other side's last bid, or redouble a double of their own side's. Three passes after a bid end the auction; four
  passes at the start and the hand is dealt again by the next dealer, with no score.
- The declarer is the player of the winning side who first named the contract's strain; their partner is the dummy.
  The player on the declarer's left leads, then the dummy's cards are laid face up and the declarer plays both
  hands. When Helen declares, she plays your cards.
- Players must follow suit if they can. The highest trump wins, or the highest card of the suit led. The winner leads
  the next trick.
- Scoring: contract tricks below the line (20 a minor, 30 a major, 40 then 30 at no trumps; doubled ×2, redoubled
  ×4). 100 below the line is a game, after which both sides start the next game from nothing; a side with a game is
  vulnerable. Above the line: overtricks (trick value, or 100/200 a trick doubled, twice that redoubled), 50 or 100
  for making a doubled or redoubled contract, slams (500/750 small, 1000/1500 grand), undertricks (50/100 each
  undoubled; doubled 100, 300, 500, then +300 each not vulnerable, or 200, then +300 each vulnerable; redoubled
  twice that), honours (100 for four trump honours in one hand, 150 for five, 150 for four aces at no trumps,
  whoever holds them), and 700 or 500 for winning the rubber two games to none or to one.
- The first side to win two games wins the rubber. Refreshing the page starts a new one.

## The computer players

`src/engine/bidding.ts` and `src/engine/bot.ts`. They bid a small natural system, written up in How to play: 1NT
15-17, 2NT 20-21, 2♣ 22 or more, five-card majors, weak twos and threes, natural responses and overcalls, and
takeout doubles. Each situation's calls are listed with what they show, and the same list is used both to choose a
call and to read one, so the computer players understand each other's calls and yours. After the first round each
adds up what the partnership has (its own points and a cautious guess at partner's), looks for an eight-card fit,
and bids to the level that is worth: about 25 points for a game, 33 for a small slam.

In play they see only what a real player would: their own hand, the dummy once it is face up, the auction and the
cards played. Defenders lead partner's suit, the top of touching honours or a long suit, play second hand low and
third hand high. Declarers ruff in the short hand, draw trumps, set up long suits and cash their winners. Each has a
**skill** (Arjun 0.95, Helen 0.98, Mei 0.95), and a less skilled player more often plays a careless card. Over
600 hands, about 60% of contracts are made.

## Structure

- `src/engine/` - the rules, with no UI: `game.ts` (dealing, the auction, tricks and rubber scoring), `bidding.ts`
  and `bot.ts`. Everything is immutable: `makeCall(state, call)` and `playCard(state, card)` return the next state.
  A complete trick waits in the `collecting` phase until `collect` hands it to its winner.
- `src/lib/` - the Svelte components and sounds. The table, your hand, the controls' frame and the timing are shared
  with Hearts and Spades, in `packages/card-kit`; the table can show one hand face up for the dummy (`Dummy.svelte`).
  `BiddingBox.svelte` is your call, `Auction.svelte` the calls so far, and `ScoreSheet.svelte` the rubber's score
  sheet, above and below the line.
- `src/App.svelte` - holds the game state, which the kit's `TurnTaker` moves on.

## Commands

From this folder (or from the root with `-w apps/bridge`):

```
npm run dev      # start the dev server
npm test         # run the tests
npm run check    # type-check
npm run build    # production build in dist/
npm run e2e      # browser tests in WebKit
```

`e2e/` has Playwright tests that run in WebKit against the production build. They deal, call and play whole hands
(from the dummy too), and check that nothing throws and nothing on the table overlaps or is cut off at six screen
sizes, with the dummy and a full trick on the table and at the result.

## Credits, look and feel

The card artwork, sounds, fonts, colours and the page around the game are shared by all the games and live in
`packages/card-kit`; see the README at the root of the repository.
