<script lang="ts">
  import type { GameState } from '../engine';
  import { bannerFor } from './verdict';

  let { game, revealed }: { game: GameState; revealed: boolean } = $props();

  const banner = $derived(bannerFor(game, revealed));
</script>

<div class="verdict-slot">
  {#if banner}
    <div class="verdict {banner.tone}" role="status">
      <strong>{banner.main}</strong>
      {#if banner.sub}<span>{banner.sub}</span>{/if}
    </div>
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
  .verdict {
    display: grid;
    justify-items: center;
    padding: 0.3rem 1.2rem;
    border-radius: 1rem;
    text-align: center;
    animation: pop 0.4s cubic-bezier(0.2, 1.4, 0.4, 1) both;
  }
  .verdict strong {
    font: 400 clamp(1.1rem, 4.4cqw, 1.6rem) / 1.2 var(--serif);
  }
  .verdict span {
    font-size: 0.8rem;
    font-weight: 600;
  }
  .win {
    background: var(--win-bg);
    color: var(--win-fg);
  }
  .lose {
    background: var(--lose-bg);
    color: var(--lose-fg);
  }
  /* On a narrow table the banner must fit in the gap between the seats on the left and right. */
  @container (max-width: 600px) {
    .verdict-slot {
      max-width: 34cqw;
    }
    .verdict {
      padding: 0.25rem 0.6rem;
      text-wrap: balance;
    }
    .verdict strong {
      font-size: 1rem;
    }
    .verdict span {
      font-size: 0.7rem;
    }
  }
  @keyframes pop {
    from {
      transform: scale(0.6);
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .verdict {
      animation: none;
    }
  }
</style>
