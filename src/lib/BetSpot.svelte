<script lang="ts">
  import { MIN_BET } from '../engine';
  import ChipStack from './ChipStack.svelte';

  /** The bet being built on the betting screen. */
  let { bet }: { bet: number } = $props();
</script>

<div class="bet-spot" class:empty={bet < MIN_BET}>
  <span class="bet-label">Your bet</span>
  <div class="bet-stack">
    {#if bet >= MIN_BET}<ChipStack amount={bet} />{/if}
  </div>
  <span class="bet-amount">{bet}</span>
</div>

<style>
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
</style>
