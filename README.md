# Card games

Free, single-player card games played entirely in the browser, for play money only. There are no cookies, no login
and no advertising; visits are counted with Cloudflare Web Analytics (as on Brand New), which does not identify
anyone. The sites are funded by a Ko-fi "Support me" button.

| Game | Folder | Address |
|---|---|---|
| Blackjack | [`apps/blackjack`](apps/blackjack) | https://blackjack.matt-rarely-writes.co.uk |
| Texas Hold'em | [`apps/poker`](apps/poker) | https://poker.matt-rarely-writes.co.uk |

Each game's README has its rules. This one is about how the games are put together.

## Layout

The games are npm workspaces in one repository, so they share code without publishing or versioning anything:
a game imports a package straight from `packages/`.

```
apps/
  blackjack/        the blackjack game: its rules engine (src/engine), table, controls, pages, sounds and timing
  poker/            the Texas Hold'em game, the same way
packages/
  cards-core/       plain TypeScript: Card, Rank and Suit, a deck or shoe, a fair shuffle, secure and seeded random numbers
  card-kit/         what every game looks and sounds like: see below
  e2e/              the Playwright set-up and helpers for each game's browser tests
```

`@card-games/card-kit` holds:

- the card artwork (`src/cards`), sounds (`src/sounds`) and fonts (`src/fonts`);
- `PlayingCard.svelte` (with the flip that works in Safari, see below), `CardBack`, `CardPile` (a deck or shoe),
  `Chip`, `ChipStack` and `chips.ts`;
- `motion.ts`: a card flying in and turning over, and the visitor's reduced-motion setting;
- `synth.ts` and `sound.svelte.ts`: the sound engine, the sounds every game has, and mute;
- `Site.svelte`: the page every game sits in (header, How to play and About pages, footer, Support me button), with the
  small router that keeps the game running while you read the rules;
- `app.css`: the colours, fonts and shared styles, matching Brand New (https://brand-new.matt-rarely-writes.co.uk);
- `public/`: what every site serves as it is: `staticwebapp.config.json` (the Azure security headers, routes and
  caching), the favicon, `robots.txt` and the 404 page's styles;
- `vite.ts`: the Vite set-up every game uses, which also copies `public/` into each game's build;
- `scripts/`: how the card images and sounds were made.

Only what is already the same in two games goes in a package. The rules, table layouts, timing and game-specific
sounds stay in the game. A game passes in its own details where they differ: its name, its chip values, where cards
fly in from, and its extra sounds.

## Commands

From the root, for every game and package, or add `-w apps/poker` (for example) for just one:

```
npm install
npm run check    # type-check
npm test         # unit tests
npm run build    # production builds, in apps/<game>/dist
npm run e2e      # browser tests in WebKit (see below)
```

To play a game while working on it: `npm run dev -w apps/blackjack`.

### Browser tests

Each game has Playwright tests in `apps/<game>/e2e/` that run in **WebKit**, the engine behind Safari and every browser
on iPhone, against the production build served with the same security headers as the live site. They play real hands
and check that cards are dealt face up (judged from screenshots), that nothing throws or is blocked by the security
headers, and that nothing on the table overlaps or is cut off at five screen sizes. To set up once:
`npx playwright install webkit`.

WebKit does not reliably apply `backface-visibility`, which once made every card show its back in Safari. Cards are
two stacked faces instead, each swapped in halfway through the turn (`packages/card-kit/src/motion.ts`); the tests
guard it.

### Static analysis

`npx -y fallow` checks the whole repository for dead code, duplication and complexity. It should find nothing.

## Adding a game

1. Make `apps/<game>` with a `package.json` like the others (depending on `@card-games/card-kit` and
   `@card-games/cards-core`), a `vite.config.ts` of `export default gameConfig();`, an `index.html`, a
   `public/404.html`, and a `playwright.config.ts` with its own port.
2. Import `@card-games/card-kit/app.css` in `src/main.ts`, and put the game inside `<Site name="…" {HowToPlay} {About}>`.
3. Keep the rules in `src/engine`, with no UI, and test them.
4. Copy a game's workflow in `.github/workflows/` for its checks and deployment.

## Hosting

Each game is its own Azure Static Web App. GitHub Actions builds it (Azure's own build does not understand npm
workspaces) and uploads `apps/<game>/dist`: see `.github/workflows/`. A game is tested and redeployed only when it or
a shared package changes. The apps are `swa-blackjack` and `swa-poker` (Free plan)
in the `rg-matt-rarely-writes` resource group, with their addresses as CNAME records at Porkbun. Deploying uses
each app's deploy token, kept as the repository secret `AZURE_STATIC_WEB_APPS_API_TOKEN_<GAME>`; without it the
deploy step only says so.

## Rebuilding the card images and sounds

They are committed, so this is only needed to change them. From `packages/card-kit`:

- `node scripts/build-cards.mjs <folder with the downloaded SVGs>`: see the comments at the top for which files.
- `node scripts/build-sounds.mjs <folder holding the unzipped Kenney pack>`.

## Credits

- Card artwork: Byron Knoll's vector playing cards, released into the public domain
  (https://commons.wikimedia.org/wiki/Category:Playing_cards_set_by_Byron_Knoll), converted to small WebP images.
- Card and chip sounds: Kenney's Casino Audio pack (https://kenney.nl/assets/casino-audio), released under Creative
  Commons Zero. The jingles are synthesised in the browser.
- Fonts: Figtree, Young Serif and DM Sans, under the SIL Open Font License (see
  `packages/card-kit/src/fonts/README.md`).

## Licence

MIT, see `LICENSE`. The artwork, sounds and fonts keep their own licences, above.
