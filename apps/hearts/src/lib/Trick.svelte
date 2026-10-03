<script lang="ts">
  import PlayingCard from '@card-games/card-kit/PlayingCard.svelte';
  import { reducedMotion, type Origin } from '@card-games/card-kit/motion';
  import { cubicIn } from 'svelte/easing';
  import { HUMAN_SEAT, type GameState } from '../engine';
  import { COLLECT_DURATION, fromElement, offset } from './motion';

  let { game, yourCardFrom }: { game: GameState; /** Where your last card was in your hand: it flies from there. */ yourCardFrom: Origin } = $props();

  // Who takes the trick: still known once it has been collected, when its cards slide across to them.
  let takenBy = -1;
  $effect.pre(() => {
    if (game.winner >= 0) takenBy = game.winner;
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
  {#each game.trick as { seat, card } (`${game.hand}-${game.tricksPlayed}-${seat}`)}
    <div class="spot p{seat}">
      <div class="card" class:winning={game.winner === seat} out:toWinner>
        <PlayingCard
          {card}
          from={seat === HUMAN_SEAT ? yourCardFrom : fromElement(`fan-${seat}`)}
          faceUp={seat === HUMAN_SEAT}
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
