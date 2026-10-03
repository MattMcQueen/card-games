<script lang="ts">
  import ResultBanner from '@card-games/card-kit/ResultBanner.svelte';
  import type { GameState } from '../engine';
  import { bannerFor } from './verdict';

  let { game, revealed }: { game: GameState; revealed: boolean } = $props();

  const banner = $derived(bannerFor(game, revealed));
</script>

<div class="verdict-slot">
  {#if banner}
    <ResultBanner {...banner} />
  {/if}
</div>

<style>
  /* Takes the place of the pot, just above the board (the pot is swept away once the result shows), without
     taking any room of its own. It sits on the bottom edge of the pot's place, so a long one grows upwards. */
  .verdict-slot {
    position: absolute;
    bottom: 0;
    left: 50%;
    z-index: 3;
    translate: -50% 0;
    width: max-content;
    max-width: 90cqw;
  }
  /* On a narrow table the banner must fit in the gap between the seats on the left and right. */
  @container (max-width: 600px) {
    .verdict-slot {
      max-width: 34cqw;
    }
  }
</style>
