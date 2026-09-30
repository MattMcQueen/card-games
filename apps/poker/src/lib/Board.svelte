<script lang="ts">
  import PlayingCard from '@card-games/card-kit/PlayingCard.svelte';
  import type { Card } from '../engine';
  import { boardDelay } from './motion';

  let {
    cards,
    hand,
    from,
    faded,
  }: {
    cards: readonly Card[];
    hand: number;
    /** Index of the first card dealt by the latest move: earlier ones are already there. */
    from: number;
    /** Cards to dim at a showdown: those not part of a winning hand. */
    faded: ReadonlySet<string> | null;
  } = $props();
</script>

<div class="board" role="group" aria-label="Community cards">
  {#each [0, 1, 2, 3, 4] as slot (slot)}
    <div class="slot">
      {#each cards.slice(slot, slot + 1) as card (`${hand}-${slot}`)}
        <div class="card" class:dim={!!faded && !faded.has(card.rank + card.suit)}>
          <PlayingCard {card} delay={boardDelay(slot, from)} />
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .board {
    display: flex;
    justify-content: center;
    gap: clamp(0.15rem, 0.9cqw, 0.5rem);
  }
  .slot {
    width: var(--cw);
    height: var(--ch);
    border: 1.5px dashed color-mix(in srgb, var(--gold) 25%, transparent);
    border-radius: 6px;
  }
  .card {
    transition: filter 0.3s;
  }
  .card.dim {
    /* Darkened rather than faded, so the card stays solid and nothing shows through it. */
    filter: brightness(0.55) grayscale(0.5);
  }
</style>
