<script lang="ts">
  import { MAX_BET, MIN_BET, STARTING_CHIPS, insuranceCost, type Action, type GameState } from '../engine';
  import Chip from './Chip.svelte';
  import { DENOMINATIONS } from './chips';

  let {
    game,
    bet,
    limit,
    actions,
    showResults,
    over,
    onchip,
    onclear,
    ondeal,
    onplay,
    onnext,
    onrestart,
  }: {
    game: GameState;
    /** The bet being built on the betting screen, and the most it can be. */
    bet: number;
    limit: number;
    /** The moves allowed right now. */
    actions: readonly Action[];
    showResults: boolean;
    /** The player has run out of chips. */
    over: boolean;
    onchip: (value: number) => void;
    onclear: () => void;
    ondeal: () => void;
    onplay: (action: Action) => void;
    onnext: () => void;
    onrestart: () => void;
  } = $props();

  const stake = $derived(insuranceCost(game.hands[0]?.bet ?? 0));

  // The moves in the player's own turn, with what each button says and how it is reached.
  const moves: { action: Action; label: string; title: string; key: string }[] = [
    { action: 'hit', label: 'Hit', title: 'Hit (H)', key: 'H' },
    { action: 'stand', label: 'Stand', title: 'Stand (S)', key: 'S' },
    { action: 'double', label: 'Double', title: 'Double down (D)', key: 'D' },
    { action: 'split', label: 'Split', title: 'Split (P)', key: 'P' },
    { action: 'surrender', label: 'Surrender', title: 'Surrender for half your bet back (R)', key: 'R' },
  ];
</script>

<div class="controls">
  {#if game.phase === 'betting'}
    <p class="hint">Bet {MIN_BET} to {MAX_BET} chips</p>
    <div class="rack">
      {#each [...DENOMINATIONS].reverse() as value (value)}
        <button
          type="button"
          class="chip-button"
          onclick={() => onchip(value)}
          disabled={bet >= limit}
          aria-label="Add {value} to bet"
          title="Add {value}"
        >
          <Chip {value} />
        </button>
      {/each}
      <button type="button" class="btn quiet" onclick={onclear} disabled={bet === 0}>Clear</button>
    </div>
    <button type="button" class="btn primary" onclick={ondeal} disabled={bet < MIN_BET}>Deal</button>
  {:else if game.phase === 'insurance'}
    <p class="hint">
      The dealer shows an ace. Insurance costs {stake} and pays 2 to 1 if the dealer's next card gives them blackjack.
    </p>
    <div class="actions">
      <button type="button" class="btn primary" onclick={() => onplay('insure')} title="Take insurance (I)" aria-keyshortcuts="I">Insurance ({stake})</button>
      <button type="button" class="btn" onclick={() => onplay('decline')} title="No insurance (N)" aria-keyshortcuts="N">No thanks</button>
    </div>
  {:else if game.phase === 'player'}
    <div class="actions">
      {#each moves as { action, label, title, key } (action)}
        <button type="button" class="btn" onclick={() => onplay(action)} disabled={!actions.includes(action)} {title} aria-keyshortcuts={key}>{label}</button>
      {/each}
    </div>
  {:else if !showResults}
    <div class="actions-spacer" aria-hidden="true"></div>
  {:else if over}
    <p class="over">Game over: you are out of chips.</p>
    <button type="button" class="btn primary" onclick={onrestart}>Play again with {STARTING_CHIPS} chips</button>
  {:else}
    <button type="button" class="btn primary" onclick={onnext}>Next hand</button>
  {/if}
</div>

<style>
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
  @media (prefers-reduced-motion: reduce) {
    .chip-button {
      transition: none;
    }
  }
</style>
