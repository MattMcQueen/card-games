<script lang="ts">
  import { chipsFor } from './chips';
  import Chip from './Chip.svelte';

  let { amount, fate = 'none' }: { amount: number; fate?: 'none' | 'lost' } = $props();

  const chips = $derived(chipsFor(amount));
</script>

<div class="stack" class:lost={fate === 'lost'} style="--count: {chips.length}" aria-hidden="true">
  {#each chips as value, i (i)}
    <span class="slot" style="--i: {i}"><Chip {value} /></span>
  {/each}
</div>

<style>
  .stack {
    position: relative;
    width: var(--chip);
    height: calc(var(--chip) + var(--count) * var(--chip) * 0.11);
  }
  .slot {
    position: absolute;
    left: 0;
    bottom: calc(var(--i) * var(--chip) * 0.11);
    width: var(--chip);
    height: var(--chip);
    animation: drop 0.3s ease-out both;
    animation-delay: calc(var(--i) * 45ms);
  }
  .lost {
    animation: sweep 0.7s ease-in forwards;
  }
  @keyframes drop {
    from {
      transform: translateY(-14px);
      opacity: 0;
    }
  }
  @keyframes sweep {
    to {
      transform: translateY(-90px);
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .slot,
    .lost {
      animation: none;
    }
    .lost {
      opacity: 0.35;
    }
  }
</style>
