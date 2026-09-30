<script lang="ts">
  import type { Card } from '../engine';
  import { cardImage } from './cardImages';
  import { isFaceCard, pipsFor } from './cardLayout';
  import CardBack from './CardBack.svelte';
  import { deal, flipDown, flipUp } from './motion';

  let { card, delay = 0, still = false }: { card: Card; delay?: number; still?: boolean } = $props();

  const names = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' } as const;
  const red = $derived(card.suit === 'H' || card.suit === 'D');
  const pips = $derived(pipsFor(card.rank));
  const face = $derived(isFaceCard(card.rank));
  const ace = $derived(card.rank === 'A');

  // The photo-quality artwork is fetched separately, so a simple drawn card stands in until it
  // has arrived (a slow connection, or the first card of a game). Once it has, it replaces it.
  const src = $derived(cardImage(card));
  let image = $state<HTMLImageElement>();
  let ready = $state(false);
  $effect(() => {
    if (image?.complete && image.naturalWidth > 0) ready = true;
  });
</script>

<!-- A card flies in face down from the deck and turns over as it lands. `still` skips the flight: a card already
     on the table that is being turned over, such as an opponent's at a showdown. -->
<div class="card" role="img" aria-label="{card.rank} of {names[card.suit]}" in:deal|global={{ delay, still }}>
<div class="face-up" in:flipUp|global={{ delay, still }}>
{#if src}
  <img bind:this={image} {src} alt="" draggable="false" class:ready onload={() => (ready = true)} />
{/if}
<svg
  class="fallback"
  class:red
  class:hidden={ready}
  viewBox="0 0 100 140"
  preserveAspectRatio="none"
  aria-hidden="true"
>
  <rect class="face" x="0.75" y="0.75" width="98.5" height="138.5" rx="8" />

  {#each [false, true] as flipped (flipped)}
    <g transform={flipped ? 'rotate(180 50 70)' : undefined}>
      <text class="index" x="12.5" y="23" text-anchor="middle" font-size={card.rank === '10' ? 16 : 19}>{card.rank}</text>
      <use href="#suit-{card.suit}" x="5.5" y="27" width="14" height="14" />
    </g>
  {/each}

  {#if ace}
    <use href="#suit-{card.suit}" x="26" y="46" width="48" height="48" />
  {:else if face}
    <rect class="frame" x="21" y="24" width="58" height="92" rx="4" />
    <text class="court" x="50" y="88" text-anchor="middle" font-size="52">{card.rank}</text>
    <use href="#suit-{card.suit}" x="43" y="28" width="14" height="14" />
    <use href="#suit-{card.suit}" x="43" y="98" width="14" height="14" transform="rotate(180 50 105)" />
  {:else}
    {#each pips as pip, i (i)}
      <use
        href="#suit-{card.suit}"
        x={pip.x - 9.5}
        y={pip.y - 9.5}
        width="19"
        height="19"
        transform={pip.flip ? `rotate(180 ${pip.x} ${pip.y})` : undefined}
      />
    {/each}
  {/if}
</svg>
</div>
<div class="face-down" in:flipDown|global={{ delay, still }}><CardBack /></div>
</div>

<style>
  .card {
    position: relative;
    width: var(--cw);
    height: var(--ch);
    flex: none;
    filter: drop-shadow(0 2px 3px rgb(0 0 0 / 0.55));
  }
  /* The two faces are stacked. Resting, the front shows and the back is hidden. While a card turns over, each
     face is swapped in at the halfway point by motion.ts, rather than relying on backface-visibility, which
     WebKit (Safari, and every browser on iPhone) does not apply reliably. */
  .face-up,
  .face-down {
    position: absolute;
    inset: 0;
  }
  .face-down {
    opacity: 0;
  }
  img,
  .fallback {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  img {
    opacity: 0;
    user-select: none;
    -webkit-user-drag: none;
  }
  img.ready {
    opacity: 1;
  }
  .fallback {
    color: #1c1c1c;
    fill: currentColor;
  }
  .hidden {
    visibility: hidden;
  }
  .red {
    color: #c8102e;
  }
  .face {
    fill: #fdfcf8;
    stroke: #c9c5b8;
    stroke-width: 1;
  }
  .index {
    font: 700 19px Georgia, 'Times New Roman', serif;
    fill: currentColor;
  }
  .court {
    font-family: Georgia, 'Times New Roman', serif;
    font-weight: 700;
    fill: currentColor;
  }
  .frame {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.4;
    opacity: 0.55;
  }
</style>
