<script lang="ts">
  import {
    MAX_BET,
    MIN_BET,
    STARTING_CHIPS,
    act,
    isGameOver,
    legalActions,
    maxBet,
    newGame,
    nextRound,
    startRound,
    type Action,
  } from './engine';
  import Chip from './lib/Chip.svelte';
  import { DENOMINATIONS } from './lib/chips';
  import ChipStack from './lib/ChipStack.svelte';
  import HandView from './lib/HandView.svelte';
  import InfoDialogs from './lib/InfoDialogs.svelte';
  import KofiButton from './lib/KofiButton.svelte';
  import KofiDialog from './lib/KofiDialog.svelte';
  import { preloadCards } from './lib/cardImages';
  import { cuesFor } from './lib/cues';
  import { outcomeLabel, signed } from './lib/labels';
  import { reducedMotion, settleDelay } from './lib/motion';
  import Shoe from './lib/Shoe.svelte';
  import { playCues, unlockAudio } from './lib/sound.svelte';
  import SoundToggle from './lib/SoundToggle.svelte';
  import SupportButton from './lib/SupportButton.svelte';
  import Sprites from './lib/Sprites.svelte';
  import TableMarkings from './lib/TableMarkings.svelte';
  import ThemeToggle from './lib/ThemeToggle.svelte';

  // The shoe is large and never edited in place, so it needs no deep reactivity.
  let game = $state.raw(newGame());
  let wanted = $state(10);
  let info: InfoDialogs;
  let kofi: KofiDialog;

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
    settling ? game.chips - game.results.reduce((sum, r) => sum + r.returned, 0) : game.chips,
  );

  const netTotal = $derived(game.results.reduce((sum, r) => sum + r.net, 0));
  const banner = $derived.by(() => {
    if (!showResults) return null;
    const blackjack = game.results.some((r) => r.outcome === 'blackjack');
    if (netTotal > 0) return { kind: 'win', text: `${blackjack ? 'Blackjack! ' : ''}You win ${netTotal}` };
    if (netTotal < 0) return { kind: 'lose', text: `Dealer wins ${-netTotal}` };
    return { kind: 'push', text: 'Push' };
  });

  const announcement = $derived.by(() => {
    if (!showResults) return '';
    const parts = game.results.map((r) => `${outcomeLabel[r.outcome]} ${signed(r.net)}`);
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

  const keys: Record<string, Action> = { h: 'hit', s: 'stand', d: 'double', p: 'split' };
  function onkeydown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    if (document.querySelector('dialog[open]')) return; // a panel is open: keys belong to it
    const action = keys[event.key.toLowerCase()];
    if (action && actions.includes(action)) {
      event.preventDefault();
      play(action);
    }
  }
</script>

<svelte:window {onkeydown} onpointerdown={preloadCards} />
<Sprites />

<main>
  <header>
    <h1>Blackjack</h1>
    <div class="header-right">
      <p class="balance" aria-label="Chips: {shownChips}">
        <span class="balance-chip"><Chip value={5} /></span>
        <strong>{shownChips}</strong>
      </p>
      <KofiButton onclick={() => kofi.show()} />
      <SoundToggle />
      <ThemeToggle />
    </div>
  </header>

  <div class="sr-only" role="status" aria-live="polite">{announcement}</div>

  <div class="rail">
    <div class="felt">
      <TableMarkings />
      <div class="shoe-corner"><Shoe /></div>

      <div class="zone dealer-zone">
        {#if inRound}
          <HandView title="Dealer" role="dealer" cards={game.dealer} hideTotal={settling} />
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

      {#if banner}
        <p class="banner {banner.kind}" role="presentation">{banner.text}</p>
      {/if}
      {#if game.shuffled && inRound && !revealed}
        <p class="shuffle-note">Shuffling a fresh shoe…</p>
      {/if}
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
        <button type="button" class="ghost" onclick={() => (wanted = 0)} disabled={bet === 0}>Clear</button>
      </div>
      <button type="button" class="deal" onclick={deal} disabled={bet < MIN_BET}>Deal</button>
    {:else if game.phase === 'player'}
      <div class="actions">
        <button type="button" class="act hit" onclick={() => play('hit')} disabled={!actions.includes('hit')} title="Hit (H)" aria-keyshortcuts="H">Hit</button>
        <button type="button" class="act stand" onclick={() => play('stand')} disabled={!actions.includes('stand')} title="Stand (S)" aria-keyshortcuts="S">Stand</button>
        <button type="button" class="act double" onclick={() => play('double')} disabled={!actions.includes('double')} title="Double down (D)" aria-keyshortcuts="D">Double</button>
        <button type="button" class="act split" onclick={() => play('split')} disabled={!actions.includes('split')} title="Split (P)" aria-keyshortcuts="P">Split</button>
      </div>
    {:else if !showResults}
      <div class="actions-spacer" aria-hidden="true"></div>
    {:else if over}
      <p class="over">Game over: you are out of chips.</p>
      <button type="button" class="deal" onclick={restart}>Play again with {STARTING_CHIPS} chips</button>
      <SupportButton onclick={() => kofi.show()} />
    {:else}
      <button type="button" class="deal" onclick={again}>Next hand</button>
      <SupportButton onclick={() => kofi.show()} />
    {/if}
  </div>

  <footer>
    <p>Just for fun: chips have no value and no real money is involved. Refreshing the page starts a new game.</p>
    <nav aria-label="More">
      <button type="button" class="link" onclick={() => info.showHelp()}>How to play</button>
      <button type="button" class="link" onclick={() => info.showAbout()}>About and privacy</button>
      <button type="button" class="link" onclick={() => kofi.show()}>Support me on Ko-fi</button>
    </nav>
  </footer>
</main>

<InfoDialogs bind:this={info} />
<KofiDialog bind:this={kofi} />

<style>
  main {
    max-width: 58rem;
    margin: 0 auto;
    padding: 0.75rem 1rem 1.5rem;
    display: grid;
    gap: 0.9rem;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }
  h1 {
    margin: 0;
    font: 700 clamp(1.2rem, 5.4vw, 1.7rem) Georgia, 'Times New Roman', serif;
    letter-spacing: 0.04em;
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: clamp(0.3rem, 1.5vw, 0.6rem);
  }
  .balance {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin: 0;
    padding: 0.2rem clamp(0.6rem, 3vw, 0.9rem) 0.2rem 0.3rem;
    border: 1px solid var(--line);
    border-radius: 2rem;
    background: var(--panel);
    font-size: clamp(1rem, 4.5vw, 1.15rem);
    font-variant-numeric: tabular-nums;
  }
  .balance-chip {
    width: 1.9rem;
    height: 1.9rem;
  }

  /* The table: a walnut rail around green felt. */
  .rail {
    padding: clamp(0.5rem, 1.6vw, 0.9rem);
    border-radius: clamp(1.2rem, 4vw, 2.4rem);
    background: linear-gradient(160deg, #6b4423, #3d2410 55%, #5a3a1e);
    box-shadow:
      0 10px 30px rgb(0 0 0 / 0.45),
      inset 0 1px 1px rgb(255 255 255 / 0.25);
  }
  .felt {
    position: relative;
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 0.5rem;
    min-height: clamp(27rem, 62vh, 36rem);
    padding: 1rem 0.5rem 1rem;
    border-radius: clamp(0.8rem, 3vw, 1.7rem);
    overflow: hidden;
    color: #fff;
    background:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .14 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"),
      radial-gradient(ellipse at 50% 40%, #1b8a55 0%, #0f6b3f 55%, #084a2b 100%);
    box-shadow: inset 0 0 40px rgb(0 0 0 / 0.55);
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
    min-height: calc(var(--ch) + 4rem);
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
    border: 2px solid rgb(244 224 160 / 0.5);
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
    color: rgb(244 224 160 / 0.8);
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

  .banner {
    position: absolute;
    left: 50%;
    top: 46%;
    z-index: 2;
    margin: 0;
    padding: 0.5rem 1.4rem;
    border-radius: 3rem;
    font: 800 clamp(1.1rem, 4vw, 1.6rem) Georgia, 'Times New Roman', serif;
    white-space: nowrap;
    transform: translate(-50%, -50%);
    box-shadow: 0 6px 18px rgb(0 0 0 / 0.5);
    animation: banner-in 0.45s cubic-bezier(0.2, 1.4, 0.4, 1) both;
  }
  .banner.win {
    background: linear-gradient(#ffe082, #ffca28);
    color: #2b2100;
  }
  .banner.lose {
    background: linear-gradient(#a02222, #741212);
    color: #fff;
  }
  .banner.push {
    background: linear-gradient(#eceff1, #b0bec5);
    color: #1c2a30;
  }
  .shuffle-note {
    position: absolute;
    left: 1rem;
    top: 0.9rem;
    margin: 0;
    font-size: 0.85rem;
    font-style: italic;
    color: rgb(255 255 255 / 0.75);
  }
  @keyframes banner-in {
    from {
      transform: translate(-50%, -50%) scale(0.5);
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
    height: 3rem;
  }
  button {
    font: inherit;
  }
  button:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 3px;
  }
  .act,
  .deal,
  .ghost {
    min-width: 5.2rem;
    min-height: 3rem;
    padding: 0.5rem 1.3rem;
    border: 0;
    border-radius: 3rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #fff;
    cursor: pointer;
    box-shadow:
      0 3px 0 rgb(0 0 0 / 0.35),
      0 6px 12px rgb(0 0 0 / 0.25);
    transition: transform 0.1s, box-shadow 0.1s, filter 0.15s;
  }
  .act:hover:not(:disabled),
  .deal:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  .act:active:not(:disabled),
  .deal:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow: 0 1px 0 rgb(0 0 0 / 0.35);
  }
  .act:disabled,
  .deal:disabled,
  .ghost:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .hit {
    background: linear-gradient(#3fa34d, #2a7a36);
  }
  .stand {
    background: linear-gradient(#d13b3b, #a02222);
  }
  .double {
    background: linear-gradient(#f0b429, #cc8c0a);
    color: #2b1d00;
  }
  .split {
    background: linear-gradient(#2f80d9, #1a5aa8);
  }
  .deal {
    min-width: 9rem;
    background: linear-gradient(#ffe082, #ffb300);
    color: #2b1d00;
  }
  .ghost {
    min-width: 0;
    background: var(--panel);
    color: var(--ink);
    border: 1px solid var(--line);
    box-shadow: none;
    text-transform: none;
    font-weight: 600;
  }
  .over {
    flex-basis: 100%;
    margin: 0;
    text-align: center;
    font-weight: 700;
  }
  footer p {
    margin: 0;
    text-align: center;
    font-size: 0.85rem;
    color: var(--muted);
  }
  nav {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem 1.25rem;
    margin-top: 0.5rem;
  }
  .link {
    min-height: 2.5rem;
    padding: 0 0.25rem;
    border: 0;
    background: none;
    color: var(--ink);
    font-size: 0.9rem;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  @media (prefers-reduced-motion: reduce) {
    .banner {
      animation: none;
    }
  }
</style>
