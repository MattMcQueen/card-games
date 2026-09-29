<script lang="ts">
  import {
    MAX_BET,
    MIN_BET,
    STARTING_CHIPS,
    act,
    insuranceCost,
    isGameOver,
    legalActions,
    maxBet,
    newGame,
    nextRound,
    startRound,
    type Action,
  } from './engine';
  import About from './lib/About.svelte';
  import { preloadCards } from './lib/cardImages';
  import Chip from './lib/Chip.svelte';
  import { DENOMINATIONS } from './lib/chips';
  import ChipStack from './lib/ChipStack.svelte';
  import { cuesFor } from './lib/cues';
  import HandView from './lib/HandView.svelte';
  import HowToPlay from './lib/HowToPlay.svelte';
  import { outcomeLabel, signed } from './lib/labels';
  import { reducedMotion, settleDelay } from './lib/motion';
  import { nav } from './lib/router.svelte';
  import Shoe from './lib/Shoe.svelte';
  import SiteHeader from './lib/SiteHeader.svelte';
  import { playCues, unlockAudio } from './lib/sound.svelte';
  import Sprites from './lib/Sprites.svelte';
  import SupportMe from './lib/SupportMe.svelte';
  import TableMarkings from './lib/TableMarkings.svelte';

  // The shoe is large and never edited in place, so it needs no deep reactivity.
  let game = $state.raw(newGame());
  let wanted = $state(10);

  // After the dealer plays, the results wait until the dealer's cards have landed.
  let revealed = $state(false);
  $effect(() => {
    if (game.phase !== 'settled') {
      revealed = false;
      return;
    }
    const id = setTimeout(() => (revealed = true), reducedMotion ? 0 : settleDelay(game.dealer.length));
    return () => clearTimeout(id);
  });

  const limit = $derived(maxBet(game));
  const bet = $derived(Math.min(wanted, limit));
  const actions = $derived(legalActions(game));
  const over = $derived(isGameOver(game));
  const inRound = $derived(game.phase !== 'betting');
  const settling = $derived(game.phase === 'settled' && !revealed);
  const showResults = $derived(game.phase === 'settled' && revealed);

  // Chips held, not counting winnings still to be revealed.
  const shownChips = $derived(
    settling
      ? game.chips - game.results.reduce((sum, r) => sum + r.returned, 0) - game.insuranceReturned
      : game.chips,
  );

  // The insurance bet is a separate wager: what it won (2 to 1) or lost.
  const insuranceNet = $derived(game.insuranceReturned - game.insurance);
  const netTotal = $derived(game.results.reduce((sum, r) => sum + r.net, 0) + insuranceNet);
  // One result for the whole round. With several hands each one is also labelled on the table;
  // with one hand this banner is the only place the result is shown.
  const banner = $derived.by(() => {
    if (!showResults) return null;
    const outcomes = game.results.map((r) => r.outcome);
    const only = outcomes.length === 1 ? outcomes[0] : undefined;
    if (only === 'surrender') return { kind: 'lose', text: `Surrendered, lose ${-netTotal}` };
    const lead = outcomes.includes('blackjack') ? 'Blackjack! ' : only === 'bust' ? 'Bust! ' : '';
    if (netTotal > 0) return { kind: 'win', text: `${lead}You win ${netTotal}` };
    if (netTotal < 0) return { kind: 'lose', text: `${lead}Dealer wins ${-netTotal}` };
    return { kind: 'push', text: game.insuranceReturned > 0 ? 'Even: insurance paid' : 'Push' };
  });

  const announcement = $derived.by(() => {
    if (!showResults) return '';
    const parts = game.results.map((r) => `${outcomeLabel[r.outcome]} ${signed(r.net)}`);
    if (game.insurance > 0) parts.push(`Insurance ${signed(insuranceNet)}`);
    return `Round over. ${parts.join(', ')}. You have ${game.chips} chips.${over ? ' You are out of chips.' : ''}`;
  });

  // Every change of game state goes through here so the matching sounds are played.
  // Browsers only start audio from a tap or key press, and all of these run from one.
  function update(next: typeof game) {
    unlockAudio();
    preloadCards();
    playCues(cuesFor(game, next));
    game = next;
  }

  function addChip(value: number) {
    unlockAudio();
    preloadCards();
    playCues([{ sound: 'chip', at: 0 }]);
    wanted = Math.min(bet + value, limit);
  }
  function deal() {
    update(startRound(game, bet));
  }
  function play(action: Action) {
    update(act(game, action));
  }
  function again() {
    update(nextRound(game));
  }
  function restart() {
    unlockAudio();
    playCues([{ sound: 'shuffle', at: 0 }]);
    game = newGame();
    wanted = 10;
  }

  const keys: Record<string, Action> = {
    h: 'hit',
    s: 'stand',
    d: 'double',
    p: 'split',
    r: 'surrender',
    i: 'insure',
    n: 'decline',
  };
  function onkeydown(event: KeyboardEvent) {
    if (nav.route !== 'game') return;
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    if (document.querySelector(':popover-open')) return; // the Support me panel is open: keys belong to it
    const action = keys[event.key.toLowerCase()];
    if (action && actions.includes(action)) {
      event.preventDefault();
      play(action);
    }
  }
</script>

<svelte:window {onkeydown} onpointerdown={preloadCards} />
<Sprites />

<a class="skip" href="#main">Skip to content</a>
<SiteHeader />

<!-- The game stays in the page while you read How to play, so a round is never lost. -->
<main id="main" class="wrap" tabindex="-1">
  <div class="game" hidden={nav.route !== 'game'}>
    <h1 class="sr-only">Blackjack</h1>
    <div class="sr-only" role="status" aria-live="polite">{announcement}</div>

    <div class="rail">
      <div class="felt">
        <TableMarkings faded={inRound} />
        <p class="balance" aria-label="Chips: {shownChips}">
          <span class="balance-chip"><Chip value={5} /></span>
          <strong>{shownChips}</strong>
        </p>
        <div class="shoe-corner"><Shoe /></div>

        <div class="zone dealer-zone">
          {#if inRound}
            <HandView title="Dealer" role="dealer" cards={game.dealer} hideTotal={settling} />
          {/if}
        </div>

        <div class="verdict">
          {#if banner}
            <p class="banner {banner.kind}" role="presentation">{banner.text}</p>
          {:else if game.shuffled && inRound}
            <p class="shuffle-note">Shuffling a fresh shoe…</p>
          {/if}
          {#if game.insurance > 0}
            <p class="side-bet">
              {#if showResults}
                Insurance {game.insuranceReturned > 0 ? `pays +${insuranceNet}` : `lost −${game.insurance}`}
              {:else}
                Insurance {game.insurance}
              {/if}
            </p>
          {/if}
        </div>

        <div class="zone player-zone">
          {#if inRound}
            <div class="hands">
              {#each game.hands as hand, i (i)}
                <HandView
                  title={game.hands.length > 1 ? `Hand ${i + 1}` : 'You'}
                  role="player"
                  cards={hand.cards}
                  bet={hand.bet}
                  active={game.phase === 'player' && i === game.active}
                  result={showResults ? game.results[i] : undefined}
                  showPill={game.hands.length > 1}
                />
              {/each}
            </div>
          {:else}
            <div class="bet-spot" class:empty={bet < MIN_BET}>
              <span class="bet-label">Your bet</span>
              <div class="bet-stack">
                {#if bet >= MIN_BET}<ChipStack amount={bet} />{/if}
              </div>
              <span class="bet-amount">{bet}</span>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <div class="controls">
      {#if game.phase === 'betting'}
        <p class="hint">Bet {MIN_BET} to {MAX_BET} chips</p>
        <div class="rack">
          {#each [...DENOMINATIONS].reverse() as value (value)}
            <button
              type="button"
              class="chip-button"
              onclick={() => addChip(value)}
              disabled={bet >= limit}
              aria-label="Add {value} to bet"
              title="Add {value}"
            >
              <Chip {value} />
            </button>
          {/each}
          <button type="button" class="btn quiet" onclick={() => (wanted = 0)} disabled={bet === 0}>Clear</button>
        </div>
        <button type="button" class="btn primary" onclick={deal} disabled={bet < MIN_BET}>Deal</button>
      {:else if game.phase === 'insurance'}
        <p class="hint">
          The dealer shows an ace. Insurance costs {insuranceCost(game.hands[0]?.bet ?? 0)} and pays 2 to 1 if the dealer's next card gives them blackjack.
        </p>
        <div class="actions">
          <button type="button" class="btn primary" onclick={() => play('insure')} title="Take insurance (I)" aria-keyshortcuts="I">Insurance ({insuranceCost(game.hands[0]?.bet ?? 0)})</button>
          <button type="button" class="btn" onclick={() => play('decline')} title="No insurance (N)" aria-keyshortcuts="N">No thanks</button>
        </div>
      {:else if game.phase === 'player'}
        <div class="actions">
          <button type="button" class="btn" onclick={() => play('hit')} disabled={!actions.includes('hit')} title="Hit (H)" aria-keyshortcuts="H">Hit</button>
          <button type="button" class="btn" onclick={() => play('stand')} disabled={!actions.includes('stand')} title="Stand (S)" aria-keyshortcuts="S">Stand</button>
          <button type="button" class="btn" onclick={() => play('double')} disabled={!actions.includes('double')} title="Double down (D)" aria-keyshortcuts="D">Double</button>
          <button type="button" class="btn" onclick={() => play('split')} disabled={!actions.includes('split')} title="Split (P)" aria-keyshortcuts="P">Split</button>
          <button type="button" class="btn" onclick={() => play('surrender')} disabled={!actions.includes('surrender')} title="Surrender for half your bet back (R)" aria-keyshortcuts="R">Surrender</button>
        </div>
      {:else if !showResults}
        <div class="actions-spacer" aria-hidden="true"></div>
      {:else if over}
        <p class="over">Game over: you are out of chips.</p>
        <button type="button" class="btn primary" onclick={restart}>Play again with {STARTING_CHIPS} chips</button>
      {:else}
        <button type="button" class="btn primary" onclick={again}>Next hand</button>
      {/if}
    </div>
  </div>

  {#if nav.route === 'how-to-play'}
    <HowToPlay />
  {:else if nav.route === 'about'}
    <About />
  {/if}
</main>

<footer class="site-footer">
  <div class="wrap">
    <p class="disclosure">Just for fun: chips have no value and no real money is involved. Refreshing the page starts a new game.</p>
  </div>
</footer>

<SupportMe />

<style>
  main {
    padding-top: 20px;
    padding-bottom: 32px;
    min-height: 60vh;
  }
  main:focus {
    outline: none; /* it only takes focus when the page changes */
  }
  .game {
    display: grid;
    gap: 0.9rem;
  }
  .game[hidden] {
    display: none;
  }

  /* The table: a walnut rail around green felt. */
  .rail {
    padding: clamp(0.5rem, 1.6vw, 0.9rem);
    border-radius: clamp(1.2rem, 4vw, 2.4rem);
    background: linear-gradient(160deg, var(--wood-1), var(--wood-2) 55%, var(--wood-3));
    box-shadow:
      0 10px 30px rgb(0 0 0 / 0.45),
      inset 0 1px 1px rgb(255 255 255 / 0.25);
  }
  .felt {
    position: relative;
    display: grid;
    grid-template-rows: auto auto 1fr;
    gap: 0.25rem;
    min-height: clamp(27rem, 62vh, 36rem);
    padding: 1rem 0.5rem 1rem;
    border-radius: clamp(0.8rem, 3vw, 1.7rem);
    overflow: hidden;
    color: var(--on-felt);
    background:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .14 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"),
      radial-gradient(ellipse at 50% 40%, var(--felt-1) 0%, var(--felt-2) 55%, var(--felt-3) 100%);
    box-shadow: inset 0 0 40px rgb(0 0 0 / 0.55);
  }
  .balance {
    position: absolute;
    top: 0.8rem;
    left: 0.8rem;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin: 0;
    padding: 0.2rem clamp(0.6rem, 3vw, 0.9rem) 0.2rem 0.3rem;
    border: 1px solid color-mix(in srgb, var(--gold) 35%, transparent);
    border-radius: 2rem;
    background: rgb(0 0 0 / 0.35);
    font-size: clamp(1rem, 4.5vw, 1.15rem);
    font-variant-numeric: tabular-nums;
  }
  .balance-chip {
    width: 1.9rem;
    height: 1.9rem;
  }
  /* On a phone the dealer's label (which can read "SOFT 11") reaches toward the corner, so the
     chip count sheds its icon to stay out of the way. */
  @media (max-width: 480px) {
    .balance {
      padding: 0.2rem 0.7rem;
      font-size: 1rem;
    }
    .balance-chip {
      display: none;
    }
  }
  .shoe-corner {
    position: absolute;
    top: 0.8rem;
    right: 1rem;
  }
  .zone {
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }
  .dealer-zone {
    min-height: calc(var(--ch) + 2.6rem);
  }
  .player-zone {
    align-self: end;
  }
  .hands {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem 0.5rem;
  }

  .bet-spot {
    display: grid;
    justify-items: center;
    align-content: end;
    gap: 0.3rem;
    width: calc(var(--chip) * 3.2);
    height: calc(var(--chip) * 3.2);
    border: 2px solid color-mix(in srgb, var(--gold) 50%, transparent);
    border-radius: 50%;
    padding-bottom: 0.4rem;
  }
  .bet-spot.empty {
    border-style: dashed;
  }
  .bet-label {
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--gold) 80%, transparent);
  }
  .bet-stack {
    min-height: calc(var(--chip) * 1.6);
    display: flex;
    align-items: flex-end;
  }
  .bet-amount {
    font-size: 1.05rem;
    font-weight: 800;
  }

  /* The round's result gets its own row between the two hands, so it never covers a card. */
  .verdict {
    display: grid;
    place-items: center;
    align-content: center;
    gap: 0.25rem;
    min-height: 2.75rem;
  }
  .banner {
    margin: 0;
    padding: 0.4rem 1.3rem;
    border: 2px solid #fff;
    border-radius: 999px;
    font: 400 clamp(1.1rem, 4vw, 1.5rem) / 1.2 var(--serif);
    white-space: nowrap;
    transform: rotate(-2deg);
    box-shadow: 0 4px 14px rgb(0 0 0 / 0.45);
    animation: banner-in 0.45s cubic-bezier(0.2, 1.4, 0.4, 1) both;
  }
  .banner.win {
    background: var(--win-bg);
    color: var(--win-fg);
  }
  .banner.lose {
    background: var(--lose-bg);
    color: var(--lose-fg);
  }
  .banner.push {
    background: var(--push-bg);
    color: var(--push-fg);
  }
  .side-bet {
    margin: 0;
    padding: 0.1rem 0.8rem;
    border: 1px solid color-mix(in srgb, var(--gold) 50%, transparent);
    border-radius: 999px;
    background: rgb(0 0 0 / 0.3);
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--gold);
  }
  .shuffle-note {
    margin: 0;
    font-size: 0.85rem;
    font-style: italic;
    color: color-mix(in srgb, var(--on-felt) 75%, transparent);
  }
  @keyframes banner-in {
    from {
      transform: rotate(-2deg) scale(0.5);
      opacity: 0;
    }
  }

  /* Controls */
  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    min-height: 4.2rem;
  }
  .hint {
    flex-basis: 100%;
    margin: 0;
    text-align: center;
    font-size: 0.9rem;
    color: var(--muted);
  }
  .rack {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .chip-button {
    width: 3.5rem;
    height: 3.5rem;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: none;
    cursor: pointer;
    transition: transform 0.12s;
  }
  .chip-button:hover:not(:disabled) {
    transform: translateY(-3px);
  }
  .chip-button:active:not(:disabled) {
    transform: translateY(0) scale(0.95);
  }
  .chip-button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.6rem;
  }
  .actions-spacer {
    height: 46px;
  }
  .over {
    flex-basis: 100%;
    margin: 0;
    text-align: center;
    font-weight: 700;
  }

  /* Footer */
  .site-footer {
    padding-bottom: 80px; /* room for the Support me button */
    font-size: 15px;
    color: var(--muted);
  }
  .site-footer .wrap {
    padding-top: 24px;
    border-top: 1px solid var(--line);
  }
  .site-footer p {
    margin: 0 0 10px;
  }
  .disclosure {
    color: var(--fg);
    font-weight: 600;
    text-align: center;
  }

  @media (prefers-reduced-motion: reduce) {
    .banner {
      animation: none;
    }
    .chip-button {
      transition: none;
    }
  }
</style>
