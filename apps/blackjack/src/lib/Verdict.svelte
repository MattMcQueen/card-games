<script lang="ts">
  import type { GameState } from '../engine';
  import { bannerFor, insuranceNote } from './verdict';

  let { game, showResults }: { game: GameState; showResults: boolean } = $props();

  const banner = $derived(showResults ? bannerFor(game) : null);
  const shuffling = $derived(game.shuffled && game.phase !== 'betting');
</script>

<!-- The round's result gets its own row between the two hands, so it never covers a card. -->
<div class="verdict">
  {#if banner}
    <p class="banner {banner.kind}" role="presentation">{banner.text}</p>
  {:else if shuffling}
    <p class="shuffle-note">Shuffling a fresh shoe…</p>
  {/if}
  {#if game.insurance > 0}
    <p class="side-bet">{showResults ? insuranceNote(game) : `Insurance ${game.insurance}`}</p>
  {/if}
</div>

<style>
  .verdict {
    display: grid;
    place-items: center;
    align-content: center;
    gap: 0.25rem;
    min-height: 2.75rem;
  }
  .banner {
    margin: 0;
    padding: 0.4rem 1.3rem;
    border: 2px solid #fff;
    border-radius: 999px;
    font: 400 clamp(1.1rem, 4vw, 1.5rem) / 1.2 var(--serif);
    white-space: nowrap;
    transform: rotate(-2deg);
    box-shadow: 0 4px 14px rgb(0 0 0 / 0.45);
    animation: banner-in 0.45s cubic-bezier(0.2, 1.4, 0.4, 1) both;
  }
  .banner.win {
    background: var(--win-bg);
    color: var(--win-fg);
  }
  .banner.lose {
    background: var(--lose-bg);
    color: var(--lose-fg);
  }
  .banner.push {
    background: var(--push-bg);
    color: var(--push-fg);
  }
  .side-bet {
    margin: 0;
    padding: 0.1rem 0.8rem;
    border: 1px solid color-mix(in srgb, var(--gold) 50%, transparent);
    border-radius: 999px;
    background: rgb(0 0 0 / 0.3);
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--gold);
  }
  .shuffle-note {
    margin: 0;
    font-size: 0.85rem;
    font-style: italic;
    color: color-mix(in srgb, var(--on-felt) 75%, transparent);
  }
  @keyframes banner-in {
    from {
      transform: rotate(-2deg) scale(0.5);
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .banner {
      animation: none;
    }
  }
</style>
