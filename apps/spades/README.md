# Spades

A free, single-player game of Spades: you and a computer partner against two computer players, played entirely in
the browser.

No money is involved. There are no cookies, no login and no advertising; visits are counted with Cloudflare Web
Analytics, which does not identify anyone. The site is funded by a Ko-fi "Support me" button.

Built from the same pieces as the other games (Svelte 5, Vite, TypeScript, a pure and well-tested rules engine, no
backend), in the card-games repository: see the README at the root for how the games are put together.

## Rules

As at https://officialgamerules.org/game-rules/spades/, without its house rule of double nil.

- Four players in two partnerships, partners facing: you (seat 0) and Grace across (seat 2), against Omar on your left
  (seat 1) and Lena on your right (seat 3). Play goes to the left (clockwise).
- Each hand uses a fresh, cryptographically shuffled 52-card deck, dealt one card at a time from the dealer's left,
  thirteen each. Aces are high and spades are always trumps. Lena deals the first hand, and the deal passes to the left.
- Starting on the dealer's left, each player bids the tricks they expect to take, 0 to 13. A bid of 0 is nil.
  Partners' bids add up to their side's bid.
- The player on the dealer's left leads the first trick. Players must follow suit if they can, and otherwise may play
  any card. The highest spade wins, or with no spade the highest card of the suit led. The winner leads the next.
- Spades may not be led until a spade has been played, unless the leader has only spades.
- A side that takes at least its bid scores 10 a trick bid and 1 a trick over (a bag); one that does not loses 10 a
  trick bid. Every 10 bags a side gathers costs it 100 points, and the bags left over carry on.
- Nil: 100 points to the side if the player takes no tricks, minus 100 if they take any. Their tricks still count
  towards their partner's bid, and as bags.
- When a hand ends with a side on 500 or more, the higher score wins. If both sides are level, play goes on.
- Refreshing the page restarts the game.

## The computer players

`src/engine/bot.ts`. They bid by counting tricks: aces, guarded kings, the top spades, each spade beyond the third,
and spare spades to trump short suits, rounded down. With a hand that has no high spades and nothing that must win,
they bid nil (unless their partner already has). In play, they win tricks while their side still needs them, or while
the other side can still make its bid, leading cards nobody can beat, taking tricks as cheaply as they can and
leaving a trick to a partner already winning it. Once their side's bid is safe they try to lose the rest, to avoid
bags. They cover a partner's nil by playing high, and try to leave an opponent bidding nil holding a trick. They only
see what a real player would see: their own hand, the bids and the cards played so far.

Each has a **skill** from 0 to 1, and a less skilled player more often plays a careless card (any card it may play)
instead of a thought-out one: Omar (0.75), Grace (0.9), Lena (0.75). The suggested bid you start from is what a
computer player would bid with your cards. Over 2,000 bot-only hands, sides made their bid 88% of the time and nil
bids succeeded 86% of the time, and a game lasts about 12 hands.

## Structure

- `src/engine/` - the rules, with no UI: `game.ts` (dealing, bidding, tricks and scoring) and `bot.ts`. The deck and
  shuffle are shared, in `packages/cards-core`. Everything is immutable: `playCard(state, card)` returns the next state.
  A complete trick waits in the `collecting` phase until `collect` hands it to its winner, so the table can show it.
  Tests include rigged hands for following suit, trumping and breaking spades, scoring of bids, bags and nil, and
  whole games played by the computer that check every hand takes 13 tricks and adds up on the score sheet.
- `src/lib/` - the Svelte components and sounds (`cues.ts` decides which sound goes with a change of state). The table,
  your hand, the controls' frame and the timing are shared with Hearts, in `packages/card-kit`, and the parts of the
  rules every trick-taking game has are in `packages/cards-core`.
- `src/App.svelte` - holds the game state, which the kit's `TurnTaker` moves on: it takes the computer players' bids
  and turns a little apart so you can follow them, and leaves each complete trick on the table for a moment before it
  is taken.

## Commands

From this folder (or from the root with `-w apps/spades`):

```
npm run dev      # start the dev server
npm test         # run the tests
npm run check    # type-check
npm run build    # production build in dist/
npm run e2e      # browser tests in WebKit (see below)
```

### Browser tests

`e2e/` has Playwright tests that run in **WebKit**, the engine behind Safari and every browser on iPhone, against the
production build (served with the same security headers as the live site). They deal, bid and play a whole hand, and
check that your cards are dealt face up and the others' face down, that the bid can be set from nil to thirteen, that
the hand's thirteen tricks reach the score sheet, that nothing throws or is blocked by the security headers, and that
nothing on the table overlaps or is cut off at six screen sizes, with a full trick on the table and at the result.
To set up once: `npx playwright install webkit`.

## Credits, look and feel

The card artwork, sounds, fonts, colours and the page around the game are shared by all the games and live in
`packages/card-kit`; see the README at the root of the repository for what they are and where they come from.
