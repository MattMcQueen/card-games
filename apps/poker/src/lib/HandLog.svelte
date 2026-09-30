<script lang="ts">
  import type { GameState } from '../engine';
  import { entryText } from './labels';

  let { game }: { game: GameState } = $props();

  // The last few moves, newest first, so it is easy to see what the others just did.
  const entries = $derived(
    game.log
      .filter((e) => e.kind !== 'small-blind' && e.kind !== 'big-blind')
      .map((entry) => ({ entry, text: entryText(entry, game) }))
      .slice(-6)
      .reverse(),
  );
</script>

<section class="log" aria-label="Hand history">
  <h2>This hand</h2>
  {#if entries.length === 0}
    <p class="empty">Nothing yet: the blinds are in.</p>
  {:else}
    <ol>
      {#each entries as { entry, text }, i (game.log.length - i)}
        <li class:board={entry.kind === 'board'} class:win={entry.kind === 'win'}>{text}</li>
      {/each}
    </ol>
  {/if}
</section>

<style>
  .log {
    max-width: 34rem;
    margin: 0 auto;
    padding: 0.7rem 1.2rem;
    border: 1px solid var(--line);
    border-radius: 1rem;
    background: var(--surface);
    font-size: 0.9rem;
  }
  h2 {
    margin: 0 0 0.3rem;
    font: 700 0.75rem/1 var(--sans);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--accent);
  }
  ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    padding: 0.1rem 0;
    color: var(--soft);
  }
  li:first-child {
    color: var(--fg);
    font-weight: 600;
  }
  li.board {
    color: var(--fg);
  }
  li.win {
    font-weight: 700;
    color: var(--accent);
  }
  .empty {
    margin: 0;
    color: var(--muted);
  }
</style>
