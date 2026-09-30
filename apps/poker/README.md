# Texas Hold'em

A free, single-player Texas Hold'em game against five computer players, played entirely in the browser.

Not gambling: there is no real money, and chips have no value. Nothing about visitors is stored,
there is no login, and no advertising. The site is funded by a Ko-fi "Support me" button.

Built from the same pieces as the blackjack game (Svelte 5, Vite, TypeScript, a pure and well-tested rules
engine, no backend), in the card-games repository: see the README at the root for how the games are put together.

## Rules

The game follows the rules of a UK casino cash game.

- Six seats: you (seat 0) and five computer players. Everyone starts with 1000 chips. Blinds are 5 and 10 and never change; there are no antes.
- No-limit Texas Hold'em. The button moves one seat clockwise each hand; the two seats after it post the small and big blinds.
- Each hand uses a fresh, cryptographically shuffled 52-card deck. A card is burned before the flop, turn and river.
- Betting: fold, check, call, bet/raise (any amount up to the whole stack) or all-in.
  - The minimum bet after the flop is a big blind. A raise must be at least as big as the last bet or raise in the round.
  - The big blind has the option to raise if everyone just calls before the flop.
  - An all-in for less than a full raise does not reopen the betting for players who have already acted, unless
    several short all-ins add up to a full raise (a player may raise again once the bet has gone up by a full raise since they acted).
  - Side pots are made for every all-in level. A bet nobody can call is handed back.
  - Ties split the pot; an odd chip goes to the winning seat nearest the left of the button.
  - When everyone left is all-in (or only one player has chips left to act), the rest of the board is dealt with no more betting.
- At a showdown every remaining hand is turned over. If everyone else folds, the last player wins without showing.
- No rake or time charge.
- Computer players who fall below one big blind buy back in for 1000 (as new players sit at a real table). If you lose all your chips the game is over and can be restarted.
- Refreshing the page restarts the game.

## The computer players

`src/engine/bot.ts`. Before the flop they use the Chen formula to rate their starting hand against a threshold that
depends on position, the number of raises and how deep their stack is. After the flop they estimate their equity by
dealing out the rest of the hand against random hands, shade it down when facing a bet, and compare it with the pot odds.
They only see what a real player would see, and the engine checks that every move they make is legal.

Each seat has its own style (how loose, how aggressive, how often it bluffs) and its own **skill** from 0 to 1, so the
table is a mix of easy and tough players. Skill makes a player worse in four ways: it misjudges its starting hand,
estimates its winning chances from fewer trials (a rougher answer), takes less notice of what a bet says, and makes two
mistakes more often: calling bets it should fold, and just calling with hands it should raise. From easiest to toughest:
Terry (0.15), Nigel (0.4), Gary (0.55), Margaret (0.8), Priya (0.95). In bot-only simulations the results order the same
way: Priya wins the most chips per hand and Terry loses the most.

## Structure

- `src/engine/` - the rules, with no UI: `game.ts` (dealing, betting rounds, settlement), `evaluate.ts` (hand ranking,
  packed into one number so hands compare with `>`), `pots.ts` (side pots) and `bot.ts`. The deck and shuffle are shared, in `packages/cards-core`.
  Everything is immutable: `act(state, action)` returns the next state. Tests include rigged decks for showdowns and side pots,
  and random play that checks no chips are ever created or lost.
- `src/lib/` - the Svelte components, sounds (`cues.ts` decides which sound goes with a change of state) and timing (`motion.ts`).
- `src/App.svelte` - holds the game state and takes the computer players' turns a little apart so you can follow.

## Commands

From this folder (or from the root with `-w apps/poker`):

```
npm run dev      # start the dev server
npm test         # run the tests
npm run check    # type-check
npm run build    # production build in dist/
npm run e2e      # browser tests in WebKit (see below)
```

### Browser tests

`e2e/` has Playwright tests that run in **WebKit**, the engine behind Safari and every browser on iPhone, against the
production build (served with the same security headers as the live site). They deal and play real hands and check that:
cards are dealt face up and the opponents' face down (judged from screenshots, as it depends on how well the browser draws
a card turning over), the flop and showdown turn out right, nothing throws or is blocked by the security headers, and that
nothing on the table overlaps or is cut off at five screen sizes from a small phone to a wide desktop, both mid-hand and
when the result is showing. To set up once: `npx playwright install webkit`.

## Credits, look and feel

The card artwork, sounds, fonts, colours and the page around the game are shared by all the games and live in
`packages/card-kit`; see the README at the root of the repository for what they are and where they come from.
