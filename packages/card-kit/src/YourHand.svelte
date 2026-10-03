<script lang="ts">
  import { cardKey, cardName, YOUR_SEAT, type Card } from '@card-games/cards-core';
  import { flip } from 'svelte/animate';
  import { reducedMotion } from './motion';
  import PlayingCard from './PlayingCard.svelte';
  import { dealDelay, dealOrder, fromElement } from './trickMotion';

  const none: ReadonlySet<string> = new Set();

  let {
    cards,
    hand,
    dealer,
    mode,
    playable,
    selected = none,
    received = none,
    receivedFrom = -1,
    onpick,
  }: {
    cards: readonly Card[];
    /** The number of the hand, so a new hand's cards are dealt afresh. */
    hand: number;
    /** Who dealt it: the deal starts on their left. */
    dealer: number;
    /** Choosing cards to pass, choosing one to play, or waiting. */
    mode: 'pass' | 'play' | 'wait';
    /** The cards you may play now (as "QS"). */
    playable: ReadonlySet<string>;
    /** The cards chosen to pass. */
    selected?: ReadonlySet<string>;
    /** The cards passed to you, marked until the first trick is over. */
    received?: ReadonlySet<string>;
    /** The seat they came from: they fly in from there. */
    receivedFrom?: number;
    /** A card was chosen; `from` is the card on the screen. */
    onpick: (card: Card, from: HTMLElement) => void;
  } = $props();

  const order = $derived(dealOrder(YOUR_SEAT, dealer));
</script>

<!-- Your cards, fanned along the bottom of the table. They are buttons when you can pick one. -->
<div class="hand-area">
  <div class="hand" style:--n={cards.length} role="group" aria-label="Your hand">
    {#each cards as card, i (`${hand}-${cardKey(card)}`)}
      {@const key = cardKey(card)}
      {@const usable = mode === 'pass' || (mode === 'play' && playable.has(key))}
      <button
        type="button"
        class="slot card-button"
        class:selected={mode === 'pass' && selected.has(key)}
        class:usable
        class:received={received.has(key)}
        disabled={!usable}
        aria-pressed={mode === 'pass' ? selected.has(key) : undefined}
        aria-label={cardName(card)}
        data-card={key}
        onclick={(event) => onpick(card, event.currentTarget)}
        animate:flip={{ duration: reducedMotion ? 0 : 250 }}
      >
        <PlayingCard
          {card}
          delay={received.has(key) ? 0 : dealDelay(order, i)}
          from={received.has(key) ? fromElement(`fan-${receivedFrom}`) : undefined}
          dim={mode === 'play' && !usable}
        />
      </button>
    {/each}
  </div>
</div>

<style>
  .hand-area {
    container-type: inline-size;
    width: 100%;
  }
  /* The cards overlap by as much as they must to fit across, but no more than shows most of each card. */
  .hand {
    --cw: clamp(2.8rem, 15.5cqw, 5.2rem);
    --ch: calc(var(--cw) * 1.455);
    --step: min(calc(var(--cw) * 0.62), calc((100cqw - var(--cw)) / max(var(--n) - 1, 1)));
    display: flex;
    justify-content: center;
    /* Room above for a chosen card, which rises. */
    padding-top: calc(var(--ch) * 0.2);
  }
  /* A card button (app.css), which rises under the pointer when you can pick it. */
  .slot {
    transition: translate 0.15s ease-out;
  }
  .slot + .slot {
    margin-left: calc(var(--step) - var(--cw));
  }
  @media (hover: hover) {
    .usable:hover {
      translate: 0 -8%;
    }
  }
  .selected,
  .selected:hover {
    translate: 0 -20%;
  }
  /* Cards passed to you have a gold edge until the first trick is over. */
  .received::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0 3px var(--highlight);
    pointer-events: none;
  }
</style>
