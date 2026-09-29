<script lang="ts">
  import { handValue, type Card, type HandResult } from '../engine';
  import PlayingCard from './PlayingCard.svelte';
  import { outcomeLabel, signed } from './labels';

  let {
    title,
    cards,
    bet,
    active = false,
    result,
  }: {
    title: string;
    cards: readonly Card[];
    bet?: number;
    active?: boolean;
    result?: HandResult;
  } = $props();

  const value = $derived(handValue(cards));
</script>

<section class="hand" class:active aria-label={title}>
  <h2>
    {title}
    {#if cards.length > 0}
      <span class="total">{value.soft ? 'soft ' : ''}{value.total}</span>
    {/if}
  </h2>
  <div class="cards">
    {#each cards as card, i (i)}
      <PlayingCard {card} />
    {/each}
  </div>
  {#if bet !== undefined}
    <p class="bet">Bet: {bet}</p>
  {/if}
  {#if result}
    <p class="result {result.outcome}">{outcomeLabel[result.outcome]} ({signed(result.net)})</p>
  {/if}
</section>

<style>
  .hand {
    padding: 0.5rem 0.75rem;
    border: 2px solid transparent;
    border-radius: 0.6rem;
  }
  .active {
    border-color: #ffd54f;
  }
  h2 {
    margin: 0 0 0.4rem;
    font-size: 1rem;
    font-weight: 600;
  }
  .total {
    margin-left: 0.4rem;
    padding: 0.1rem 0.45rem;
    border-radius: 1rem;
    background: rgb(0 0 0 / 0.35);
  }
  .cards {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    min-height: 4.5rem;
  }
  p {
    margin: 0.4rem 0 0;
  }
  .result {
    font-weight: 700;
  }
</style>
