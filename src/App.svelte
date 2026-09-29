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
  import HandView from './lib/HandView.svelte';
  import { outcomeLabel, signed } from './lib/labels';

  // The shoe is large and never edited in place, so it needs no deep reactivity.
  let game = $state.raw(newGame());
  let wanted = $state(10);

  const limit = $derived(maxBet(game));
  const bet = $derived(Math.min(Math.max(wanted, MIN_BET), Math.max(limit, MIN_BET)));
  const actions = $derived(legalActions(game));
  const over = $derived(isGameOver(game));
  const inRound = $derived(game.phase !== 'betting');
  const bets = $derived(game.hands.reduce((sum, hand) => sum + hand.bet, 0));

  const summary = $derived.by(() => {
    if (game.phase !== 'settled') return '';
    const parts = game.results.map((r) => `${outcomeLabel[r.outcome]} ${signed(r.net)}`);
    return `Round over. ${parts.join(', ')}.${over ? ' You are out of chips.' : ''}`;
  });

  function deal() {
    game = startRound(game, bet);
  }
  function play(action: Action) {
    game = act(game, action);
  }
  function again() {
    game = nextRound(game);
  }
  function restart() {
    game = newGame();
    wanted = 10;
  }

  const keys: Record<string, Action> = { h: 'hit', s: 'stand', d: 'double', p: 'split' };
  function onkeydown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    const action = keys[event.key.toLowerCase()];
    if (action && actions.includes(action)) {
      event.preventDefault();
      play(action);
    }
  }
</script>

<svelte:window {onkeydown} />

<main>
  <header>
    <h1>Blackjack</h1>
    <p class="chips" aria-label="Chips">
      Chips: <strong>{game.chips}</strong>
      {#if bets > 0 && game.phase === 'player'}<span class="on-table">(+{bets} on the table)</span>{/if}
    </p>
  </header>

  <div class="sr-only" role="status" aria-live="polite">{summary}</div>

  <div class="table">
    {#if inRound}
      <HandView title="Dealer" cards={game.dealer} />
      {#each game.hands as hand, i (i)}
        <HandView
          title={game.hands.length > 1 ? `Your hand ${i + 1}` : 'Your hand'}
          cards={hand.cards}
          bet={hand.bet}
          active={game.phase === 'player' && i === game.active}
          result={game.results[i]}
        />
      {/each}
      {#if game.shuffled}
        <p class="note">The shoe was shuffled.</p>
      {/if}
    {:else}
      <p class="prompt">Place your bet, from {MIN_BET} to {MAX_BET} chips.</p>
    {/if}
  </div>

  <div class="controls">
    {#if game.phase === 'betting'}
      <div class="bet-row">
        <button type="button" onclick={() => (wanted = bet - 1)} disabled={bet <= MIN_BET} aria-label="Decrease bet" title="Decrease bet">−</button>
        <output aria-label="Bet">{bet}</output>
        <button type="button" onclick={() => (wanted = bet + 1)} disabled={bet >= limit} aria-label="Increase bet" title="Increase bet">+</button>
        {#each [5, 10, 20] as preset (preset)}
          <button type="button" onclick={() => (wanted = preset)} disabled={preset > limit} aria-label="Bet {preset}" title="Bet {preset}">{preset}</button>
        {/each}
      </div>
      <button type="button" class="primary" onclick={deal} disabled={limit < MIN_BET}>Deal</button>
    {:else if game.phase === 'player'}
      <button type="button" onclick={() => play('hit')} disabled={!actions.includes('hit')} title="Hit (H)" aria-keyshortcuts="H">Hit</button>
      <button type="button" onclick={() => play('stand')} disabled={!actions.includes('stand')} title="Stand (S)" aria-keyshortcuts="S">Stand</button>
      <button type="button" onclick={() => play('double')} disabled={!actions.includes('double')} title="Double down (D)" aria-keyshortcuts="D">Double</button>
      <button type="button" onclick={() => play('split')} disabled={!actions.includes('split')} title="Split (P)" aria-keyshortcuts="P">Split</button>
    {:else if over}
      <p class="over">Game over: you are out of chips.</p>
      <button type="button" class="primary" onclick={restart}>Play again with {STARTING_CHIPS} chips</button>
    {:else}
      <button type="button" class="primary" onclick={again}>Next hand</button>
    {/if}
  </div>

  <footer>
    <p>Just for fun: chips have no value and no real money is involved. Refreshing the page starts a new game.</p>
  </footer>
</main>

<style>
  main {
    max-width: 42rem;
    margin: 0 auto;
    padding: 1rem;
    display: grid;
    gap: 1rem;
  }
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  }
  h1 {
    margin: 0;
    font-size: 1.6rem;
  }
  .chips {
    margin: 0;
    font-size: 1.1rem;
  }
  .on-table,
  .note,
  footer p {
    opacity: 0.8;
    font-size: 0.9rem;
  }
  .table {
    display: grid;
    gap: 0.5rem;
    min-height: 16rem;
    align-content: start;
  }
  .prompt {
    margin: 2rem 0;
    text-align: center;
  }
  .note {
    margin: 0;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  .bet-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  output {
    min-width: 2.5rem;
    text-align: center;
    font-size: 1.3rem;
    font-weight: 700;
  }
  button {
    min-width: 2.75rem;
    min-height: 2.75rem;
    padding: 0.4rem 0.9rem;
    border: 0;
    border-radius: 0.5rem;
    background: #f4f1e8;
    color: #111;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  button:focus-visible {
    outline: 3px solid #ffd54f;
    outline-offset: 2px;
  }
  .primary {
    background: #ffd54f;
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
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
