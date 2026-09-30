<script lang="ts">
  import type { Card } from '@card-games/cards-core';
  import { cardImage } from './cardImages';
  import { isFaceCard, pipsFor } from './cardLayout';
  import CardBack from './CardBack.svelte';
  import { dealt, fromDeck, type Origin } from './motion';

  let {
    card,
    delay = 0,
    still = false,
    from = fromDeck,
    dim = false,
  }: {
    card: Card;
    delay?: number;
    still?: boolean;
    from?: Origin;
    /** Darkened, such as a card that is not part of the winning hand. */
    dim?: boolean;
  } = $props();

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

<!-- A card flies in face down, from the deck unless `from` says otherwise, and turns over as it lands. `still`
     skips the flight: a card already on the table that is being turned over, such as an opponent's at a showdown. -->
<div class="card" class:dim role="img" aria-label="{card.rank} of {names[card.suit]}" use:dealt={{ delay, still, from }}>
<div class="face-up">
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
<div class="face-down"><CardBack /></div>
</div>

<style>
  .card {
    position: relative;
    width: var(--cw);
    height: var(--ch);
    flex: none;
  }
  /* The two faces are stacked. Resting, the front shows and the back is hidden. While a card turns over, the
     face showing narrows to its edge and the other widens from it: a flat flip. It uses no 3D transforms,
     no backface-visibility and no filters, all of which iOS Safari mishandled here (cards shown back to
     front, or left half-drawn or vanished while others turned). Each face has its own shadow, so it
     narrows with the face; the corners are rounded like the artwork's (8 by 8 on a 100 by 140 card). */
  .face-up,
  .face-down {
    position: absolute;
    inset: 0;
    border-radius: 8% / 5.7%;
    box-shadow: 0 2px 3px rgb(0 0 0 / 0.55);
  }
  .face-down {
    opacity: 0;
  }
  /* Darkened (dim) by a shade over each face rather than a filter, so it narrows with the face as it turns.
     Darkened rather than faded, so the card stays solid and nothing shows through it. */
  .face-up::after,
  .face-down::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: rgb(0 0 0 / 0.45);
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
  }
  .dim > .face-up::after,
  .dim > .face-down::after {
    opacity: 1;
  }
  /* Being dealt (motion.ts adds the class): face down for the first part of the flight, then a quick turn
     over as it lands. Already on the table: just the turn. The widths follow the turn of a card seen
     edge-on as it swings over, fast at first and slowing as it lands; the faces swap at the edge. */
  .card:global(.card-flight) > .face-up {
    animation: turn-up-landing var(--deal-duration) linear var(--deal-delay) both;
  }
  .card:global(.card-flight) > .face-down {
    animation: turn-down-landing var(--deal-duration) linear var(--deal-delay) both;
  }
  .card:global(.card-turn) > .face-up {
    animation: turn-up var(--deal-duration) linear var(--deal-delay) both;
  }
  .card:global(.card-turn) > .face-down {
    animation: turn-down var(--deal-duration) linear var(--deal-delay) both;
  }
  /* While landing, the turn runs from 45% to 95% of the flight, and the card is edge-on at 55.3%. */
  @keyframes turn-down-landing {
    0%, 45% { transform: scaleX(1); opacity: 1; }
    47.5% { transform: scaleX(0.9); }
    50% { transform: scaleX(0.66); }
    52.5% { transform: scaleX(0.35); }
    55.3% { transform: scaleX(0); opacity: 1; }
    55.4%, 100% { transform: scaleX(0); opacity: 0; }
  }
  @keyframes turn-up-landing {
    0%, 55.3% { transform: scaleX(0); opacity: 0; }
    55.4% { opacity: 1; }
    60% { transform: scaleX(0.47); }
    65% { transform: scaleX(0.78); }
    72.5% { transform: scaleX(0.96); }
    82.5%, 100% { transform: scaleX(1); opacity: 1; }
  }
  /* A card already on the table: the same turn on its own, edge-on at 20.6%. */
  @keyframes turn-down {
    0% { transform: scaleX(1); opacity: 1; }
    5% { transform: scaleX(0.9); }
    10% { transform: scaleX(0.66); }
    15% { transform: scaleX(0.35); }
    20.6% { transform: scaleX(0); opacity: 1; }
    20.7%, 100% { transform: scaleX(0); opacity: 0; }
  }
  @keyframes turn-up {
    0%, 20.6% { transform: scaleX(0); opacity: 0; }
    20.7% { opacity: 1; }
    30% { transform: scaleX(0.47); }
    40% { transform: scaleX(0.78); }
    55% { transform: scaleX(0.96); }
    75%, 100% { transform: scaleX(1); opacity: 1; }
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
