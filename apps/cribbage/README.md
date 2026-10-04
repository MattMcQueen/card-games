# Cribbage

A free game of two-player Cribbage against a computer opponent, to 121 on a pegging board, played entirely in the
browser.

It is at https://cribbage.matt-rarely-writes.co.uk.

No money is involved. There are no cookies, no login and no advertising; visits are counted with Cloudflare Web
Analytics, which does not identify anyone. The site is funded by a Ko-fi "Support me" button.

Built from the same pieces as the other games (Svelte 5, Vite, TypeScript, a pure and well-tested rules engine, no
backend), in the card-games repository: see the README at the root for how the games are put together.

## Rules

As at https://www.theukrules.co.uk/rules/children/games/cards/cribbage/, for two players, filled out with the
standard rules where that page is silent (the point for a go or the last card, two for 31, and his nob).

- You (seat 0) against Ruth (seat 1). Each of you cuts the deck, and the lower card deals the first hand (aces low;
  a tie is cut again). The deal then takes turns.
- Each hand uses a fresh, cryptographically shuffled 52-card deck: six cards each, dealt one at a time from the
  player who is not dealing. Each player puts two face down in the dealer's crib.
- The next card is turned up as the starter. If it is a jack, the dealer pegs two for his heels.
- The play: starting with the non-dealer, players take turns laying a card and calling the count, which may not pass
  31. A player who cannot play says go, and the other carries on while they can. The last to play pegs one for the
  go (two for exactly 31, and nothing more), and the count starts again from 0, led by the other player. The last card
  of all pegs one, unless it makes 31.
- Pegging in the play: 15 for 2; 31 for 2; a pair for 2, three of a kind for 6, four for 12 (cards played one after
  another); a run of three or more of the last cards played, in any order, a point a card.
- The show: the non-dealer's hand, then the dealer's, then the dealer's crib, each with the starter. Fifteens 2 each;
  pairs 2 each; runs a point a card, every different run counting (only the longest); a flush of four in a hand 4 (5
  with the starter), but in a crib only a flush of five; his nob (the jack of the starter's suit) 1. Aces are low.
- The first to 121 wins at once, even in the middle of the play or the show, so the non-dealer, who counts first,
  can win before the dealer counts. A loser who has not passed 90 is skunked.
- Every hand is counted automatically for both players, so muggins (claiming points the other missed) does not
  arise. Refreshing the page restarts the game.

## The computer player

`src/engine/bot.ts`. Ruth discards the two cards that leave the best four on average over every one of the 46
starters that could be cut, plus a guess at what the two are worth to a crib (what they score together, fives, and
cards close enough for runs), counted for her when it is her crib and against her when it is yours. In the play she
takes the points on offer, and avoids leaving the count at 5 or 21, inviting three of a kind or a run, or leading a
card that lets you make fifteen; otherwise she plays her higher cards first, keeping low ones for later under 31. Her
skill is 0.85: now and then she plays a careless card instead (any card she may play), or thinks only of her hand
when discarding. She only sees what a real player would. Over 40 bot-only games, a hand averaged 25.5 points
between the two players (7.7 for each hand, 4.7 for the crib and 5.4 pegged in the play), and a game about 9 hands.

## Structure

- `src/engine/` - the rules, with no UI: `scoring.ts` (counting a hand, pegging in the play, and a fast count for the
  computer player), `game.ts` (the cut, the deal, the crib, the play with its goes, the show and the end of the game)
  and `bot.ts`. Everything is immutable: `playCard(state, card)` returns the next state. A finished count waits in the
  `collecting` phase until `collect` turns it over, so the table can show it. Tests include a 29 hand, nineteen (a
  hand of nothing), double and double-double runs, flushes in hands and cribs, his nob and his heels, pegging pairs,
  runs, 15 and 31, goes and the last card, winning mid-play and before the dealer counts, skunks, and whole games
  played by the computer whose score sheets add up.
- `src/lib/` - the Svelte components: the table (`Table.svelte`), the pegging board (`Board.svelte` and `board.ts`),
  the deck, starter and crib (`Stock.svelte`), the play or the hand being counted (`Middle.svelte`), the count called
  out (`Counting.svelte`), the controls, the score sheet, the sounds (`cues.ts` decides which sound goes with a change
  of state) and the timing (`motion.ts`). The page, your hand, the name plates, the corners of the table and the
  controls' frame are shared with the other games, in `packages/card-kit`.
- `src/App.svelte` - holds the game state, which the kit's `TurnTaker` moves on: it plays Ruth's cards a little apart
  so you can follow them, and leaves each finished count on the table for a moment before it is turned over.

## Commands

From this folder (or from the root with `-w apps/cribbage`):

```
npm run dev      # start the dev server
npm test         # run the tests
npm run check    # type-check
npm run build    # production build in dist/
npm run e2e      # browser tests in WebKit (see below)
```

### Browser tests

`e2e/` has Playwright tests that run in **WebKit**, the engine behind Safari and every browser on iPhone, against the
production build (served with the same security headers as the live site). They deal, discard and play a whole hand
through the show, and check that your cards are dealt face up and Ruth's face down, that only two cards can be chosen
for the crib, that the score sheet adds up to the scores on the plates and only the dealer scores a crib, that the
deal passes on, that nothing throws or is blocked by the security headers, and that nothing on the table overlaps
or is cut off at six screen sizes at every step of the play and the show. To set up once:
`npx playwright install webkit`.

## Hosting

The Azure Static Web App `swa-cribbage` (Free plan), deployed by `.github/workflows/cribbage.yml` with the repository
secret `AZURE_STATIC_WEB_APPS_API_TOKEN_CRIBBAGE`, at the CNAME `cribbage.matt-rarely-writes.co.uk` at Porkbun. Its
Cloudflare Web Analytics token is in `src/main.ts`.

## Credits, look and feel

The card artwork, sounds, fonts, colours and the page around the game are shared by all the games and live in
`packages/card-kit`; see the README at the root of the repository for what they are and where they come from.
