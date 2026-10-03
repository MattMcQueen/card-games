<script lang="ts">
  import { YOUR_SEAT, type Play } from '@card-games/cards-core';
  import { cubicIn } from 'svelte/easing';
  import { reducedMotion, type Origin } from './motion';
  import PlayingCard from './PlayingCard.svelte';
  import { COLLECT_DURATION, fromElement, offset } from './trickMotion';

  /**
   * The cards of the `trick` being played, which is trick number `round` (such as "3-5", the hand and the trick,
   * so each trick's cards are new). Once it is complete, `winner` is the seat taking it, or -1.
   */
  let {
    trick,
    round,
    winner,
    yourCardFrom,
  }: {
    trick: readonly Play[];
    round: string;
    winner: number;
    /** Where your last card was in your hand: it flies from there. */
    yourCardFrom: Origin;
  } = $props();

  // Who takes the trick: still known once it has been collected, when its cards slide across to them.
  let takenBy = -1;
  $effect.pre(() => {
    if (winner >= 0) takenBy = winner;
  });

  /** The cards of a collected trick slide to the name plate of whoever took them, shrinking as they go. */
  function toWinner(node: Element) {
    const plate = document.getElementById(`seat-${takenBy}`)?.getBoundingClientRect();
    const { dx, dy } = plate ? offset(plate, node.getBoundingClientRect()) : { dx: 0, dy: 0 };
    return {
      duration: reducedMotion ? 0 : COLLECT_DURATION,
      easing: cubicIn,
      css: (t: number, u: number) => `translate: ${u * dx}px ${u * dy}px; scale: ${0.45 + 0.55 * t}; opacity: ${Math.min(1, t * 4)}`,
    };
  }
</script>

<!-- The trick in the middle of the table: each card in front of the player who played it. -->
<div class="trick" role="group" aria-label="The trick">
  {#each trick as { seat, card } (`${round}-${seat}`)}
    <div class="spot p{seat}">
      <div class="card" class:winning={winner === seat} out:toWinner>
        <PlayingCard
          {card}
          from={seat === YOUR_SEAT ? yourCardFrom : fromElement(`fan-${seat}`)}
          faceUp={seat === YOUR_SEAT}
        />
      </div>
    </div>
  {/each}
</div>

<style>
  /* A diamond of four places: your card nearest you, the others towards their players. */
  .trick {
    position: relative;
    width: calc(var(--cw) * 2.9);
    height: calc(var(--ch) * 2.05);
  }
  .spot {
    position: absolute;
  }
  .card {
    border-radius: 8% / 5.7%;
  }
  .p0 {
    bottom: 0;
    left: 50%;
    translate: -50% 0;
  }
  .p1 {
    left: 0;
    top: 50%;
    translate: 0 -50%;
    rotate: -6deg;
  }
  .p2 {
    top: 0;
    left: 50%;
    translate: -50% 0;
  }
  .p3 {
    right: 0;
    top: 50%;
    translate: 0 -50%;
    rotate: 6deg;
  }
  /* The card taking the trick, once all four are down. */
  /* It lights up once the last card has landed. */
  .winning {
    z-index: 1;
    transition: box-shadow 0.25s ease-out 0.55s;
    box-shadow: 0 0 0 3px var(--highlight), 0 0 1rem color-mix(in srgb, var(--highlight) 70%, transparent);
  }
</style>
