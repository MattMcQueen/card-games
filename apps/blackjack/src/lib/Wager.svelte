<script lang="ts">
  import ChipStack from '@card-games/card-kit/ChipStack.svelte';
  import type { HandResult } from '../engine';
  import { chipSet } from './chips';

  let { bet, result }: { bet: number; result?: HandResult } = $props();

  // A lost hand's chips are swept away; a won one gets its winnings alongside the bet.
  const lost = $derived(
    result?.outcome === 'lose' || result?.outcome === 'bust' || result?.outcome === 'surrender',
  );
  const winnings = $derived(result?.outcome === 'win' || result?.outcome === 'blackjack' ? result.net : 0);
</script>

<div class="wager">
  <ChipStack amount={bet} set={chipSet} fate={lost ? 'lost' : 'none'} />
  {#if winnings > 0}
    <ChipStack amount={winnings} set={chipSet} />
  {/if}
  <span class="amount">{bet}</span>
</div>

<style>
  .wager {
    display: flex;
    align-items: flex-end;
    gap: 0.4rem;
    min-height: calc(var(--chip) * 1.2);
  }
  .amount {
    align-self: center;
    color: color-mix(in srgb, var(--on-felt) 85%, transparent);
    font-size: 0.85rem;
    font-weight: 700;
  }
</style>
