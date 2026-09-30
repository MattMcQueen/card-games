# Handoff: merge Blackjack and Poker into one monorepo with shared card-game code

You are picking this up cold. Read the whole file before touching anything. It was written by the previous
session (Claude Sonnet 5.5) at the end of a long working session on both projects. Everything below was true on
**2026-09-30**; verify the "current state" section with the commands given before you rely on it.

---

## 1. The goal, and what has been decided

Matt McQueen (the user, UK-based; use British English in anything user-facing, e.g. "licence", "colour") has two
small single-player, play-money card games that are built from the same pieces:

| | Blackjack | Texas Hold'em ("poker") |
|---|---|---|
| Folder | `C:\Blackjack` | `C:\poker` |
| GitHub | https://github.com/MattMcQueen/blackjack (public) | https://github.com/MattMcQueen/poker (public) |
| Branch | `main` | `main` |
| Planned address | https://blackjack.matt-rarely-writes.co.uk | not decided (ask; `poker.matt-rarely-writes.co.uk` would match) |

Both will be published on **Microsoft Azure (Static Web Apps)** "at some point", and more card games are expected.

**The user asked:** can the two share components and graphics, usable by these and future card games; is that
beneficial? The previous session answered yes and recommended **one repository with npm workspaces**
(`apps/blackjack`, `apps/poker`, `packages/...`), done **before either app is wired up to Azure**, starting with
only what is already identical. The user has now asked for this handoff so a new session can do the work.

**Do not assume the user has approved the details below.** Section 11 lists questions to put to them first
(repo name, what happens to the two existing repos, and so on). Ask, then act.

### Why it is worth doing (the evidence, so you can argue it if asked)

- About **30 tracked files are byte-for-byte identical** in the two repos, not counting the 52 card images and
  21 sounds (also identical, ~1.1 MB, stored twice) and the fonts.
- About **10 more are near-identical** (a few lines differ), and the copies have **already drifted**.
- On 2026-09-30 a real Safari bug (every card showed its back, see section 8) was found and fixed **twice**: once in
  each repo. Poker also got Playwright/WebKit tests; blackjack has none.
- More games are planned. Each new game would otherwise copy ~30+ files again.

### What is NOT to be shared

The rules engines (`src/engine/game.ts` etc.), the table layouts (`Table.svelte`, `Controls.svelte`, seat/hand views),
each game's rules and about text, game-specific sound cues and animation timing. Extract on the *second real use*;
do not design ahead. Keep the shared kit small and stable.

---

## 2. Working agreements with this user (follow these)

- **Commit, push and merge only when asked.** Earlier in the session the user said "commit these changes", "commit
  and push it" and "commit it in blackjack, and merge" explicitly each time. Do not commit unprompted. Ask before
  anything outward-facing (creating repos, pushing, making things public, deleting or archiving repos, merging PRs).
- **Blackjack's history uses pull requests with merge commits** ("Merge pull request #9 from MattMcQueen/kenney-sounds").
  Poker was committed straight to `main`. Blackjack PR #12 (the Safari fix) is the latest merged (`a007e3c`).
- Commit trailer: use the attribution your own harness gives you (the previous session's was
  `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`). Git identity is already configured in both repos:
  `Matt McQueen <55086388+MattMcQueen@users.noreply.github.com>` (GitHub noreply; safe on public repos).
- **Mute the app's sound whenever you test in a browser** (user instruction, saved as a memory). The header speaker
  button is "Mute sound". The setting is not stored, so a page reload turns sound back on: click it again after every
  reload, before other clicks.
- Verify UI changes by looking (screenshots) and by tests; do not ask the user to check manually.
- Code style in this codebase: heavy on short explanatory comments that say *why*; plain, friendly wording; small
  pure, tested functions; Svelte 5 runes; TypeScript strict (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`).
  Match the surrounding code. No new runtime dependencies (there are none today); devDependencies only when needed.
- Fallow (a static analysis tool, see section 9) must stay clean: no dead exports, no duplication, nothing over the
  complexity thresholds. The user cares about this: blackjack has a commit "Fix Fallow findings".
- Tests: keep them passing, add tests for new logic. Refactors must not change behaviour.
- When unsure of a user-level decision, use the AskUserQuestion tool (one question, concrete options).

---

## 3. Environment quirks (these will bite you)

- **Windows 11.** Two shells: PowerShell (primary) and Git Bash (via the Bash tool). Line-ending warnings
  ("LF will be replaced by CRLF") from git are harmless.
- **Bash tool heredocs fail if the body contains an unbalanced apostrophe** ("player's", "Hold'em"): the whole
  command errors with `unexpected EOF while looking for matching` and *nothing runs*. Write such content with the
  Write tool, or put a Python script in the scratchpad directory with Write and run it.
- **Python launched from Git Bash needs Windows paths** (`C:/poker/...`), not `/c/poker/...`.
- The Bash tool's working directory resets between calls: always `cd` in the same command, and use absolute paths.
- `git filter-branch` (used once to strip a file from unpublished history) also deletes the file from the working
  tree; restore it afterwards.
- Node 24 is used in CI. npm is the package manager (`package-lock.json`).
- **Ports / preview tool:** the in-app "preview_start" tool read a launch config from the session's *original*
  directory and refused (port 5173 belonged to another server). What worked: start Vite yourself in the background
  (`npx vite --port 5180 --strictPort`), then open it with `preview_start` using `url`. Stop servers when done
  (PowerShell: `Get-NetTCPConnection -LocalPort N -State Listen | ForEach { Stop-Process -Id $_.OwningProcess }`).
  `.claude/` is git-ignored in both repos.
- The Browser pane in the desktop app is **Chromium**. It cannot show WebKit bugs. Use Playwright's WebKit for that.
- **Playwright** (`@playwright/test` ^1.63, in poker's devDependencies) with **WebKit installed**
  (`npx playwright install webkit`; browsers live in `%LOCALAPPDATA%\ms-playwright`). Chromium is also installed.
  Blackjack does not have Playwright as a dependency; the previous session ran blackjack's dev server and pointed a
  throw-away spec in poker at it.
- **The site's Content-Security-Policy blocks inline stylesheets**, so `page.addStyleTag` fails in tests against the
  preview build. Set styles per element via `page.evaluate` (`el.style...`) instead. Svelte's transitions work
  because they insert rules through the CSSOM, which CSP allows.
- `gh` CLI is logged in as `MattMcQueen` with scopes `gist, read:org, repo, workflow` (the `workflow` scope was added
  by the user on 2026-09-30 so workflow files can be pushed). Pushing a workflow file without it is rejected.
- Fallow runs with `npx -y fallow` (not a dependency of either repo).
- Screenshots from Playwright can be saved into the session scratchpad and viewed with the Read tool.

---

## 4. Current state (verify first)

Run these before starting:

```bash
cd /c/Blackjack && git status -sb && git log --oneline | head -5
cd /c/poker     && git status -sb && git log --oneline | head -8
```

Expected:

- **Blackjack** `main` at `a007e3c` ("Merge pull request #12 from MattMcQueen/fix-safari-card-flip"), clean,
  in sync with origin. 128 unit tests pass (`npm test`), `npm run check` (svelte-check) clean, `npm run build` ok.
  No Playwright. CI runs check, test, build.
- **Poker** `main` at `a146846` ("Add CI: type-check, unit tests and build..."), clean, in sync with origin.
  120 unit tests + 15 passing Playwright WebKit tests (`npm run e2e`; 5 more are skipped on purpose, see 9).
  Fallow: no dead code, no duplication, nothing over the complexity thresholds. CI runs check, test, build (not e2e).
- Poker's history was rewritten once (a file removed) before its first push, so its hashes differ from anything the
  previous session quoted earlier. Ignore old hashes.

### Tech stack (identical in both `package.json`s except poker's `e2e` script and `@playwright/test`)

Svelte ^5.57 (runes), Vite ^8.3, vitest ^5, TypeScript ^6, `@sveltejs/vite-plugin-svelte` ^7.3, svelte-check ^4.7.
Dev-only script deps: `sharp`, `@breezystack/lamejs`, `@wasm-audio-decoders/ogg-vorbis` (used by
`scripts/build-cards.mjs` and `scripts/build-sounds.mjs`, run by hand; `.fallowrc.json` lists them as intentional).
No runtime dependencies. No backend. Everything runs in the browser; nothing about visitors is stored.
`vite.config.ts` reads `public/staticwebapp.config.json` and applies the same security headers to `vite preview`.
`build.assetsInlineLimit: 0` keeps card images as real, separately cached files.

### The sites' shared look

Styled to match another of the user's sites, Brand New (https://brand-new.matt-rarely-writes.co.uk): slate colours,
terracotta accent, Figtree / Young Serif / DM Sans fonts, pill nav, flat pill buttons, a floating "Support me"
(Ko-fi) button (https://ko-fi.com/mattrarelywrites). Colours are `light-dark()` tokens in `src/app.css`, including the
table's felt/walnut/gold. Menu: Game, How to play, About: real addresses (`/`, `/how-to-play`, `/about`) that the
host rewrites to `index.html` (see `public/staticwebapp.config.json` routes); a tiny client router keeps game state
alive while reading the rules.

### Security headers (must be preserved; tested by `src/hosting.test.ts`)

`public/staticwebapp.config.json` sets a strict CSP (`default-src 'self'`; `style-src 'self'` (no inline!);
`frame-src https://ko-fi.com`; `upgrade-insecure-requests`), HSTS, `X-Frame-Options: DENY`, etc., and cache headers
(`/assets/*` immutable for a year, pages 10 minutes). `hosting.test.ts` asserts these and the route rewrites.

---

## 5. Inventory: what is shared, what differs

Generated with `diff` between the two working trees on 2026-09-30. Re-run to confirm:

```bash
cd /c && for f in $(cd poker && git ls-files | grep -v '^e2e/\|package-lock'); do
  [ -f Blackjack/$f ] && { diff -q poker/$f Blackjack/$f >/dev/null && echo "SAME   $f" || echo "DIFF   $f"; }; done
```

### 5a. Byte-for-byte identical (move to the shared kit / shared config)

- Fonts: `src/fonts/*` (Figtree latin + latin-ext, Young Serif latin + latin-ext, DM Sans 600) + the three OFL licence
  texts + `README.md`.
- Card artwork: `src/lib/cards/*.webp` (52 files, ~800 KB), public-domain Byron Knoll cards converted by
  `scripts/build-cards.mjs`. Sounds: `src/lib/sounds/*.mp3` (21 files, ~180 KB): `chip-1..3`, `deal-1..8`,
  `payout-1..6`, `shuffle-1`, `sweep-1..3` (Kenney Casino Audio, CC0), built by `scripts/build-sounds.mjs`.
- `src/lib/cardImages.ts` (+ `.test.ts`): eager `import.meta.glob('./cards/*.webp', {query:'?url'})`, `preloadCards()`.
- `src/lib/cardLayout.ts` (+ test): pip positions for the drawn fallback card.
- `src/lib/Sprites.svelte` (suit symbols and the card-back pattern `#card-back-pattern`).
- `src/lib/SupportMe.svelte` (~200 lines, Ko-fi popover panel) + `kofi-logo.png`.
- `src/lib/ThemeToggle.svelte`, `SoundToggle.svelte`, `sound.svelte.ts` (mute state + `unlockAudio`).
- `src/lib/router.svelte.ts` (client router). `src/lib/routes.test.ts` is identical, `routes.ts` differs only in
  page titles.
- `src/hosting.test.ts`, `public/staticwebapp.config.json`, `public/404.css`, `public/favicon.svg`,
  `public/robots.txt`.
- `src/main.ts`, `src/vite-env.d.ts`, `svelte.config.js`.
- Tooling: `.fallowrc.json`, `.github/workflows/ci.yml`, `.gitignore`, `LICENSE` (MIT, Matt McQueen),
  `scripts/build-cards.mjs`, `scripts/build-sounds.mjs`.

### 5b. Near-identical (need a small parameter or split when moved)

| File | How poker and blackjack differ |
|---|---|
| `src/lib/PlayingCard.svelte` | Poker adds a `still` prop (skip the flight; only turn over) passed to the transitions. Otherwise same. **Both use the WebKit-safe two-face flip (section 8).** |
| `src/lib/CardBack.svelte` | Comment only. |
| `src/lib/SiteHeader.svelte` | The logo text: `Blackjack` vs `Texas Hold’em`. Needs a `title` prop (the favicon SVG is inline and identical). |
| `src/app.css` | Header comment only. All tokens identical. |
| `src/lib/motion.ts` | Shared core: `reducedMotion`, `deal` (fly in), `flipUp`/`flipDown` (turn). Differences: blackjack's `deal` flies from a fixed offset (top-right shoe); poker's computes the vector to the element `#deck` and supports `still`. Timing helpers are game-specific (`DEAL_GAP`, `dealerDelay`, `settleDelay` in blackjack; `boardDelay`, `holeDelay`, `thinkTime`... in poker). |
| `src/lib/synth.ts` | Web-Audio synth + sample loader. `SoundName` differs (blackjack: `blackjack`, `push`; poker: `bigWin`, `fold`, `check`). Make the set extensible or keep the union in the game. |
| `src/lib/chips.ts`, `Chip.svelte` | Denominations differ (blackjack `[20,10,5,1]`, poker `[500,100,25,5,1]`) and poker's `chipsFor` has a `limit`. Make denominations a parameter/config with default looks. |
| `src/lib/ChipStack.svelte` | Blackjack has a `fate` prop for the losing sweep animation; poker dropped it. |
| `vite.config.ts` | Poker adds `server: { port: Number(process.env.PORT) || 5173 }`. |
| `tsconfig.json` | Poker includes `playwright.config.ts`, `e2e/**/*.ts`. |
| `package.json` | name; poker has `e2e` script and `@playwright/test`. |
| `index.html`, `public/404.html`, `README.md` | Titles/text. |

### 5c. Genuinely per-game (stay in each app)

- **Blackjack:** `src/engine/{game,hand,shoe,constants,types,testing,index}.ts` (+tests), `App.svelte`, `Table`,
  `TableMarkings`, `Controls`, `HandView`, `BetSpot`, `Wager`, `Shoe`, `Verdict`, `HowToPlay`, `About`, `cues`, `labels`,
  `keys`, `verdict.ts`.
- **Poker:** `src/engine/{game,bot,evaluate,pots,deck,random,constants,types,testing,index}.ts` (+tests),
  `App.svelte`, `Table`, `SeatView`, `HoleCards`, `HiddenCard`, `Board`, `Deck`, `Controls`, `YourTurn`, `BetSizer`,
  `HandLog`, `Verdict`, `HowToPlay`, `About`, `cues`, `labels`, `keys`, `verdict.ts`, `raiseSizes.ts`, `motion.ts` pacing,
  and `e2e/table.spec.ts`, `playwright.config.ts`.
- Shared *primitives* hiding inside the engines (candidates for a `cards-core` package, second step): the `Card`,
  `Rank`, `Suit`, `RANKS`, `SUITS` types/constants (same in both `types.ts`), `secureRandomInt`, `shuffle`,
  `createDeck`/`createShoe(decks)` (blackjack `shoe.ts` and poker `deck.ts` are the same logic), a mulberry32 seeded
  generator (poker has `random.ts`; blackjack's `testing.ts` inlines the same code).

---

## 6. Proposed target layout (confirm names with the user)

```
card-games/                      # name TBD
  package.json                   # "private": true, "workspaces": ["apps/*", "packages/*"]
  apps/
    blackjack/                   # its own index.html, vite.config.ts, public/, src/ (engine + game UI + pages)
    poker/
  packages/
    card-kit/                    # Svelte + TS: cards, chips, deck graphic, motion primitives, sound synth, chrome
      src/ ... assets/{cards,sounds,fonts}
      package.json               # "exports" + "svelte" condition so consuming Vite compiles the .svelte files
    cards-core/                  # (step 2) Card types, shuffle/secureRandomInt/deck, seeded rng, shared test helpers
  e2e/                           # shared Playwright WebKit harness + shared specs (overlap/face-up helpers)
  .github/workflows/             # ci.yml (matrix per app) + one deploy workflow per app (Azure), path-filtered
  README.md  LICENSE  .fallowrc.json  tsconfig.base.json
```

Package name/scope is a user decision (e.g. `@matt/card-kit`). Workspaces mean **no versioning or publishing**: apps
import the package directly from the workspace.

---

## 7. Migration plan (do it in this order; each step ends green)

Work on a **branch** in whichever repo becomes the home, or in a **new repo**; never leave both apps broken.
Run all of `check`, `test`, `build` (and for poker `e2e`) at the end of every step.

0. **Confirm decisions** (section 11), then re-verify the current state (section 4).
1. **Create the monorepo skeleton** (new repo or new branch), root `package.json` with workspaces, root scripts
   (`check`, `test`, `build`, `e2e` running per workspace, e.g. `npm run check --workspaces --if-present`), a
   `tsconfig.base.json`, one root `.gitignore`, `.fallowrc.json`, `LICENSE`.
2. **Bring both apps in with history.** Options, in order of preference:
   - `git subtree add --prefix=apps/blackjack <blackjack-remote> main` and the same for poker (keeps history, simple).
   - or `git filter-repo --to-subdirectory-filter apps/blackjack` on a clone, then merge with
     `--allow-unrelated-histories`. Prefer the tool that is already installed; do not install things without asking.
   Poker's repo is small (7 commits, no PRs) and blackjack has a longer history with 12 PRs; keep both. Confirm the build/test still pass inside
   `apps/<name>` *unchanged* before extracting anything.
3. **Create `packages/card-kit`** and move **only the byte-identical files** (5a): assets, `cardImages`,
   `cardLayout`, `Sprites`, `SupportMe`, toggles, `sound.svelte.ts`, router, `app.css`, static config template,
   scripts. Apps import from the package. Decide where `app.css` lives and how fonts resolve (see 8).
4. **Move the near-identical pieces (5b)** with the smallest parameterisation (title prop, denominations config,
   `still`, extensible `SoundName`). `PlayingCard` must keep the WebKit-safe flip (section 8) and both apps'
   behaviour must be unchanged.
5. **Optionally** create `cards-core` (card types, shuffle, secure random, seeded rng) and point both engines at it.
6. **Shared test harness.** Move poker's Playwright WebKit config and helpers (`mute`, `collectErrors`,
   `isFaceUp`, `measure`/`problemsIn` overlap check) into the root `e2e/`; give blackjack a spec (deals a hand,
   cards face up, no console/CSP errors, nothing overlaps at 5 sizes).
7. **CI + Azure.** One CI workflow (matrix over apps; path filters so a game only builds when it or the kit changes)
   running check, test, build (and e2e if the user agrees). Then per-app deploy workflows: see 10.
8. **Fallow at the root** must be clean; re-tune `.fallowrc.json` entries (workspace packages, scripts, `public/`).
9. **Docs:** root README explaining layout, how to add a game, how to rebuild assets, credits/attributions (Kenney CC0,
   Byron Knoll public domain, OFL fonts) in one place; keep each app's README for its rules.
10. **Retire the old repos** only as the user decides (archive with a README pointer, or keep as-is). Do not delete.

Guard rails: after every step run the app in the browser (muted) and the WebKit tests; compare screenshots before and
after for both games; never change gameplay or look as a side effect.

---

## 8. Hard-won technical facts (do not relearn these)

1. **Safari/WebKit bug, already fixed in both apps: never use `backface-visibility` for the card flip.** Every card
   rendered face down in WebKit (Safari and all iPhone browsers) even with the `-webkit-` prefix and even after
   moving the shadow off the card. Computed styles said "hidden" but WebKit still painted the back on top. The fix
   (in `PlayingCard.svelte` + `motion.ts`): two stacked faces; resting, `.face-up` shows and `.face-down` is
   `opacity: 0`; during the flip, two Svelte transitions (`flipUp`, `flipDown`) animate `transform:
   perspective(700px) rotateY(...)` **and** set `opacity` so each face is swapped at the halfway point. Reduced
   motion returns `{duration: 0}` so cards just appear. A Playwright test in poker (`isFaceUp`) guards it; blackjack
   needs the same test after the move.
2. **CSS custom property gotcha:** `--ch: calc(var(--cw) * 1.455)` is resolved where it is declared. Overriding
   `--cw` on a descendant does NOT update `--ch`; redeclare both wherever you change `--cw`. Poker's table does this
   in several places.
3. **Table layout in poker** is driven by container queries (`.rail { container-type: inline-size }`, `cqw` units,
   a narrow layout at `@container (max-width: 600px)`), `aspect-ratio`, and seats positioned by `--x/--y`. The
   e2e overlap test (5 sizes: 360x640, 390x844, 768x1024, 1280x720, 1920x1080) caught many real overlaps; keep it.
   On phones the per-seat bet chips and opponents' hand names are hidden by design.
4. **Svelte transitions** must be `|global` to play when a parent block mounts. Cards are keyed by
   `${hand}-${index}` so a new hand re-mounts them and re-deals.
5. **Svelte 5 components used as fragments** (YourTurn has three sibling roots) are fine inside a flex container;
   their elements become direct flex children.
6. **Audio:** browsers only allow it after a tap/key; `unlockAudio()` is called from the click handlers. Sound state
   is deliberately not stored (refresh = new game, sound on).
7. `import.meta.glob` for cards/sounds resolves relative to the file that contains it, so the glob must live in the
   shared package next to the assets (or use a path that resolves from there). Test that Vite fingerprints them
   into `/assets/*` in the app build (the cache header rule depends on it).
8. Vite must compile `.svelte` files that live in a workspace package: give the package a `svelte` export condition
   (and `exports`), or add `optimizeDeps`/`resolve` config as needed; verify with `npm run build` and `vite dev` in
   both apps, and with `svelte-check`.
9. `app.css` uses relative `url("./fonts/...")` in `@font-face`; the fonts must stay next to whichever CSS file
   declares them, or the paths must be rewritten. Verify fonts load (CSP `font-src 'self'`).
10. The CSP forbids inline styles and scripts: any new shared component must not depend on `<style>` injected at
    runtime other than Svelte's own (which is built into `assets/*.css`).
11. Fallow counts exports without importers as dead. A package's public exports used only by *other workspaces* may
    be reported; check how Fallow treats workspaces (it detects them) and configure entry points rather than
    suppressing.

---

## 9. Test and analysis commands (what "green" means)

```bash
# per app today
npm run check      # svelte-check, must be 0 errors, 0 warnings
npm test           # vitest run  (blackjack 128, poker 120)
npm run build      # vite build
npm run e2e        # poker only: Playwright WebKit (webkit + iphone projects), ~1.5 min
npx -y fallow      # dead code / duplication / complexity; poker: all clean
```

Poker's e2e suite (`e2e/table.spec.ts`, `playwright.config.ts`): builds and serves `vite preview` on port 4173 with
production headers; projects `webkit` (Desktop Safari) and `iphone` (iPhone 13). Tests: deals a hand with no
errors and deck in the corner; own cards face up and opponents' face down; the flop is dealt face up; opponents
turn cards over at a showdown; a whole hand plays; layout/overlap check at 5 sizes (these 5 run only in the `webkit`
project, so 5 show as skipped for `iphone`, by design). They play real hands against random opponents, so they
can take a while and helpers handle "the others all folded to you" and "you lost your last chips ('Play again')".
The user has not yet agreed to run e2e in CI (it is ~1.5 min and plays random hands): ask.

---

## 10. Azure Static Web Apps notes (nothing is deployed yet)

Not yet decided or set up; **confirm the intended deployment with the user before building anything**. Points to
discuss and design for:

- Each game remains its own Static Web App at its own address (blackjack is planned for
  `blackjack.matt-rarely-writes.co.uk`).
- Azure's automatic (Oryx) build runs inside `app_location` and copes poorly with npm workspaces. The usual approach
  is to build in GitHub Actions (`npm ci` at the root, `npm run build -w apps/<game>`) and deploy the built folder
  with `skip_app_build: true` and `app_location: apps/<game>/dist`, one workflow per game, with `paths:` filters
  so a game redeploys only when it or `packages/**` changes.
- The security headers and route rewrites live in `public/staticwebapp.config.json` and are copied into `dist`
  by Vite (it is in `public/`). Keep it per app (or generated from one shared template) and keep `hosting.test.ts`.
- Do not create Azure resources, secrets or deploy tokens without the user's explicit go-ahead.

---

## 11. Ask the user before starting (suggested AskUserQuestion items)

1. Name of the monorepo (and the shared package scope/name).
2. Home for it: brand-new repo (recommended: cleanest; keeps both old repos intact until archived) vs converting the
   poker or blackjack repo.
3. What happens to the old repos: archive with a pointer, keep, or leave. (Never delete.) Note blackjack has PR
   history and issues.
4. Whether to add e2e (Playwright WebKit) to CI, and whether to add a blackjack e2e spec now.
5. Visibility of the new repo (both current repos are public).
6. Whether to do `cards-core` (step 5) now or later.
7. Poker's planned public address.

Also remember: creating a GitHub repo, pushing, opening/merging PRs, and archiving are outward-facing. Ask first each time.

---

## 12. Risks and rollback

- **Behaviour regressions** in card animation or layout: guard with before/after screenshots (Chromium *and*
  WebKit), the unit tests, and the e2e tests. Do not "improve" visuals during the move.
- **Vite + workspace + Svelte packaging** (section 8, items 7-9) is the main technical risk: prove it with one small
  extraction (fonts + a toggle) in both apps before moving everything.
- **Losing history:** use `git subtree`/`filter-repo`; keep the old repos untouched until the user says otherwise.
- **Rollback:** work on a branch or new repo; the two original repos stay as they are, so abandoning the migration
  costs nothing.
- Keep each step as its own commit (or PR) so it can be reverted independently.

---

## 13. Definition of done

- Both games build, pass their tests, look and play exactly as before (compare screenshots in Chromium and WebKit).
- The shared kit contains all byte-identical files and the parameterised near-identical ones; no duplicated copies
  remain in either app.
- Root `check`, `test`, `build` pass; Fallow clean; WebKit e2e passes for both games (poker's plus a blackjack spec).
- CI runs per app with path filters; deploy workflows exist only if the user asked for them.
- Root README documents the layout, how to add a new game, how to rebuild the card and sound assets, and credits.
- The user has been told which old repos still exist and what, if anything, they should archive.
- Nothing was pushed, merged, created on GitHub/Azure or deleted without the user's say-so.
