<script lang="ts">
  import { handValue, type Card, type HandResult } from '../engine';
  import ChipStack from './ChipStack.svelte';
  import { outcomeLabel, signed } from './labels';
  import { dealerDelay, reducedMotion } from './motion';
  import PlayingCard from './PlayingCard.svelte';

  let {
    title,
    role,
    cards,
    bet,
    active = false,
    hideTotal = false,
    result,
  }: {
    title: string;
    role: 'dealer' | 'player';
    cards: readonly Card[];
    bet?: number;
    active?: boolean;
    /** Hold the total back while the dealer's cards are still arriving. */
    hideTotal?: boolean;
    result?: HandResult;
  } = $props();

  const value = $derived(handValue(cards));
  const overlap = $derived(cards.length >= 4 ? -0.5 : cards.length === 3 ? -0.3 : 0.08);
  const lost = $derived(result?.outcome === 'lose' || result?.outcome === 'bust');
  const won = $derived(result?.outcome === 'win' || result?.outcome === 'blackjack');

  function delayFor(index: number): number {
    if (reducedMotion) return 0;
    if (role === 'dealer') return dealerDelay(index);
    return index === 1 ? 460 : 0;
  }
</script>

<section class="hand" class:active aria-label={title}>
  <h2>
    <span class="name">{title}</span>
    {#if cards.length > 0 && !hideTotal}
      <span class="total">{value.soft && value.total < 21 ? 'soft ' : ''}{value.total}</span>
    {/if}
  </h2>

  <div class="cards" style="--overlap: {overlap}">
    {#each cards as card, i (`${i}-${card.rank}${card.suit}`)}
      <PlayingCard {card} delay={delayFor(i)} />
    {/each}
  </div>

  {#if bet !== undefined}
    <div class="wager">
      <ChipStack amount={bet} fate={lost ? 'lost' : 'none'} />
      {#if won && result && result.net > 0}
        <ChipStack amount={result.net} />
      {/if}
      <span class="amount">{bet}</span>
    </div>
  {/if}

  <p class="pill {result ? result.outcome : 'hidden'}" aria-hidden={!result}>
    {#if result}{outcomeLabel[result.outcome]} {signed(result.net)}{:else}&nbsp;{/if}
  </p>
</section>

<style>
  .hand {
    display: grid;
    justify-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.6rem 0.5rem;
    border: 2px solid transparent;
    border-radius: 0.9rem;
    transition: border-color 0.2s, background 0.2s;
  }
  .active {
    border-color: rgb(255 213 79 / 0.85);
    background: rgb(0 0 0 / 0.12);
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgb(255 255 255 / 0.85);
  }
  .total {
    padding: 0.05rem 0.5rem;
    border-radius: 1rem;
    background: rgb(0 0 0 / 0.45);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0;
  }
  .cards {
    display: flex;
    min-height: var(--ch);
  }
  .cards > :global(*:not(:first-child)) {
    margin-left: calc(var(--cw) * var(--overlap));
  }
  .wager {
    display: flex;
    align-items: flex-end;
    gap: 0.4rem;
    min-height: calc(var(--chip) * 1.2);
  }
  .amount {
    align-self: center;
    color: rgb(255 255 255 / 0.85);
    font-size: 0.85rem;
    font-weight: 700;
  }
  .pill {
    margin: 0;
    padding: 0.15rem 0.8rem;
    border-radius: 1rem;
    font-size: 0.9rem;
    font-weight: 800;
    letter-spacing: 0.03em;
    animation: pop 0.35s cubic-bezier(0.2, 1.4, 0.4, 1) both;
  }
  .hidden {
    visibility: hidden;
    animation: none;
  }
  .win,
  .blackjack {
    background: #ffd54f;
    color: #2b2100;
  }
  .lose,
  .bust {
    background: #8e1b1b;
    color: #fff;
  }
  .push {
    background: #cfd8dc;
    color: #1c2a30;
  }
  @keyframes pop {
    from {
      transform: scale(0.6);
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .pill {
      animation: none;
    }
  }
</style>
