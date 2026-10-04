<script lang="ts">
  import type { GameState, Show } from '../engine';
  import { countCalls, short, showTitle } from './labels';

  /** A count in the show, called the way players say it, with the cards that make each part. */
  let { game, show }: { game: GameState; show: Show } = $props();

  const calls = $derived(countCalls(show));
</script>

<div class="counting">
  <p class="title">{showTitle(game, show)} with the {short(game.starter!)}: <strong>{show.count.total}</strong></p>
  {#if calls.length === 0}
    <p class="none">Nineteen: nothing to score.</p>
  {:else}
    <ol class="calls">
      {#each calls as { text, cards }, i (i)}
        <li><span class="call">{text}</span> <span class="cards">{cards}</span></li>
      {/each}
    </ol>
  {/if}
</div>

<style>
  .counting {
    flex-basis: 100%;
    display: grid;
    justify-items: center;
    gap: 0.2rem;
  }
  .title,
  .none {
    margin: 0;
    font-size: 0.95rem;
  }
  .title strong {
    color: var(--accent);
    font-size: 1.1rem;
  }
  .none {
    color: var(--muted);
  }
  .calls {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem 0.9rem;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 0.85rem;
  }
  .call::first-letter {
    text-transform: uppercase;
  }
  .call {
    display: inline-block;
    font-weight: 700;
  }
  .cards {
    color: var(--muted);
    white-space: nowrap;
  }
</style>
