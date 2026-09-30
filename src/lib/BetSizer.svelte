<script lang="ts">
  import { potSize, type GameState, type LegalActions } from '../engine';
  import { raiseSizes } from './raiseSizes';

  let {
    game,
    legal,
    amount,
    onamount,
  }: {
    game: GameState;
    legal: LegalActions;
    /** The bet or raise being set up: a total for the street, between the smallest and the whole stack. */
    amount: number;
    onamount: (to: number) => void;
  } = $props();

  const pot = $derived(potSize(game));
  const opening = $derived(game.currentBet === 0);

  const sizes = $derived(raiseSizes(game.currentBet, pot, legal));
</script>

<div class="sizer">
  <div class="presets">
    {#each sizes as { label, to } (label)}
      <button type="button" class="btn quiet" class:on={amount === to} onclick={() => onamount(to)} title="{label}: {to}">{label}</button>
    {/each}
  </div>
  <label class="slider">
    <span class="sr-only">{opening ? 'Bet' : 'Raise to'} amount</span>
    <input
      type="range"
      min={legal.minRaiseTo}
      max={legal.maxRaiseTo}
      step="1"
      value={amount}
      disabled={legal.minRaiseTo === legal.maxRaiseTo}
      oninput={(e) => onamount(e.currentTarget.valueAsNumber)}
    />
    <output>{amount}</output>
  </label>
</div>

<style>
  .sizer {
    display: flex;
    flex-basis: 100%;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.4rem 1rem;
  }
  .presets {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.35rem;
  }
  .presets .btn {
    min-height: 34px;
    padding: 0 12px;
    font-size: 0.85rem;
  }
  .presets .btn.on {
    border-color: var(--accent);
    color: var(--accent);
  }
  .slider {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: min(20rem, 100%);
  }
  .slider input {
    flex: 1;
    min-width: 0;
    accent-color: var(--accent);
  }
  .slider output {
    min-width: 3.2rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
</style>
