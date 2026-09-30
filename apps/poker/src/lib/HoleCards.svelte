<script lang="ts">
  import PlayingCard from '@card-games/card-kit/PlayingCard.svelte';
  import type { Card } from '../engine';
  import HiddenCard from './HiddenCard.svelte';
  import { holeDelay } from './motion';

  let {
    cards,
    hand,
    order,
    showFaces,
    ownCards,
    folded,
    faded,
  }: {
    cards: readonly Card[];
    /** The number of the hand, so a new hand's cards are dealt afresh. */
    hand: number;
    /** The seat's place after the button: where it comes in the deal. */
    order: number;
    /** The faces are showing: your own cards, or an opponent's at a showdown. */
    showFaces: boolean;
    /** These are your cards, dealt from the deck rather than turned over where they lie. */
    ownCards: boolean;
    folded: boolean;
    /** Cards to darken at a showdown: those that are not part of a winning hand. */
    faded: ReadonlySet<string> | null;
  } = $props();
</script>

<div class="hole">
  {#each cards as card, i (`${hand}-${i}-${showFaces}`)}
    <div class="card" class:dim={folded || (showFaces && !!faded && !faded.has(card.rank + card.suit))}>
      {#if showFaces}
        <PlayingCard {card} delay={holeDelay(order, i)} still={!ownCards} />
      {:else}
        <HiddenCard delay={holeDelay(order, i)} />
      {/if}
    </div>
  {/each}
</div>

<style>
  .hole {
    display: flex;
    justify-content: center;
    min-height: var(--ch);
  }
  .card {
    transition: filter 0.3s;
  }
  .card:not(:first-child) {
    margin-left: calc(var(--cw) * -0.14);
  }
  .card:first-child {
    rotate: -4deg;
  }
  .card:nth-child(2) {
    rotate: 4deg;
    translate: 0 -0.15rem;
  }
  .card.dim {
    /* Darkened rather than faded, so the card stays solid and nothing shows through it. */
    filter: brightness(0.55) grayscale(0.5);
  }
</style>
