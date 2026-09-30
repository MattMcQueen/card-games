<script lang="ts">
  import ChipStack from '@card-games/card-kit/ChipStack.svelte';
  import { MIN_BET } from '../engine';
  import { chipSet } from './chips';

  /** The bet being built on the betting screen. */
  let { bet }: { bet: number } = $props();
</script>

<div class="bet-spot" class:empty={bet < MIN_BET}>
  <span class="bet-label">Your bet</span>
  <div class="bet-stack">
    {#if bet >= MIN_BET}<ChipStack amount={bet} set={chipSet} />{/if}
  </div>
  <span class="bet-amount">{bet}</span>
</div>

<style>
  .bet-spot {
    display: grid;
    justify-items: center;
    align-content: end;
    gap: 0.3rem;
    /* The ring grows with the chips, but never so small on a phone that the label no longer fits inside it. */
    width: max(calc(var(--chip) * 3.2), 8rem);
    height: max(calc(var(--chip) * 3.2), 8rem);
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
