<script lang="ts">
  import type { Card } from '../engine';

  let { card }: { card: Card } = $props();

  const symbols = { S: '♠', H: '♥', D: '♦', C: '♣' } as const;
  const names = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' } as const;
  const red = $derived(card.suit === 'H' || card.suit === 'D');
</script>

<span class="card" class:red role="img" aria-label="{card.rank} of {names[card.suit]}">
  <span aria-hidden="true">{card.rank}{symbols[card.suit]}</span>
</span>

<style>
  .card {
    display: inline-grid;
    place-items: center;
    width: 3.2rem;
    height: 4.5rem;
    border-radius: 0.4rem;
    background: #fff;
    color: #111;
    font-size: 1.2rem;
    font-weight: 700;
    box-shadow: 0 1px 4px rgb(0 0 0 / 0.5);
  }
  .red {
    color: #c62828;
  }
</style>
