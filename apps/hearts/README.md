# Hearts

A free, single-player game of Hearts against three computer players, played entirely in the browser.

No money is involved. There are no cookies, no login and no advertising; visits are counted with Cloudflare Web
Analytics, which does not identify anyone. The site is funded by a Ko-fi "Support me" button.

Built from the same pieces as the blackjack and poker games (Svelte 5, Vite, TypeScript, a pure and well-tested rules
engine, no backend), in the card-games repository: see the README at the root for how the games are put together.

## Rules

As at https://officialgamerules.org/game-rules/hearts/.

- Four players: you (seat 0) and three computer players, clockwise from you: Terry on your left, Margaret across and
  Priya on your right. Play goes to the left (clockwise).
- Each hand uses a fresh, cryptographically shuffled 52-card deck, thirteen cards each. Aces are high.
- Before each hand everyone passes three cards: left, then right, then across, then a hand with no passing, and round again.
- The holder of the two of clubs leads it to the first trick. Players must follow suit if they can, and otherwise may
  play any card. The highest card of the suit led wins the trick, and its winner leads the next. No trumps.
- No hearts and no queen of spades on the first trick, unless a player has nothing else.
- Hearts may not be led until a heart has been played, unless the leader has only hearts.
- Each heart taken scores 1 point and the queen of spades 13: 26 in a hand. Taking all 26 shoots the moon: the shooter
  scores 0 and everyone else 26.
- When a hand ends with anyone on 100 or more the game is over, and the lowest score wins. A tie for lowest shares the win.
- Refreshing the page restarts the game.

## The computer players

`src/engine/bot.ts`. They pass an unguarded queen of spades, the ace and king of spades, high hearts and the cards of
short clubs and diamonds suits. In play they lead low, keep their high spades back while the queen is out and use low
spades to force her out; they follow with the highest card that still loses, take pointless tricks with high cards when
last to play, drop the queen on a king or ace of spades, and throw away the queen, high spades and high hearts when
they cannot follow suit. They only see what a real player would see: their own hand and the cards played so far.

Each has a **skill** from 0 to 1, and a less skilled player more often plays a careless card (any card it may play)
instead of a thought-out one: Terry (0.5), Margaret (0.8), Priya (0.95). Priya and Margaret also spend a few points to
take a trick with hearts in it when one other player has taken every point so far, to stop them shooting the moon.
Over 2,000 bot-only hands, points per hand were about 7.9 for Terry, 7.1 for Margaret and 6.0 for Priya.

## Structure

- `src/engine/` - the rules, with no UI: `game.ts` (dealing, passing, tricks and scoring) and `bot.ts`. The deck and
  shuffle are shared, in `packages/cards-core`. Everything is immutable: `playCard(state, card)` returns the next state.
  A complete trick waits in the `collecting` phase until `collect` hands it to its winner, so the table can show it.
  Tests include rigged hands for the first-trick and breaking-hearts rules and shooting the moon, and whole games played
  by the computer that check every hand scores 26 points (or 78 with a moon).
- `src/lib/` - the Svelte components, sounds (`cues.ts` decides which sound goes with a change of state) and timing (`motion.ts`).
- `src/App.svelte` - holds the game state, takes the computer players' turns a little apart so you can follow them, and
  leaves each complete trick on the table for a moment before it is taken.

## Commands

From this folder (or from the root with `-w apps/hearts`):

```
npm run dev      # start the dev server
npm test         # run the tests
npm run check    # type-check
npm run build    # production build in dist/
npm run e2e      # browser tests in WebKit (see below)
```

### Browser tests

`e2e/` has Playwright tests that run in **WebKit**, the engine behind Safari and every browser on iPhone, against the
production build (served with the same security headers as the live site). They deal, pass and play a whole hand, and
check that your cards are dealt face up and the others' face down, that the two of clubs leads, that the hand scores 26
points, that nothing throws or is blocked by the security headers, and that nothing on the table overlaps or is cut off
at six screen sizes, with a full trick on the table and at the result. To set up once: `npx playwright install webkit`.

## Credits, look and feel

The card artwork, sounds, fonts, colours and the page around the game are shared by all the games and live in
`packages/card-kit`; see the README at the root of the repository for what they are and where they come from.
