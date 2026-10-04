<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * In the top corners of a game's table (the felt): `info` on the left, such as the hand and who deals, on one line
   * on a wide table and a line each on a narrow one, and the game's own `corner` on the right, if it has one.
   */
  let { info, corner }: { info: readonly string[]; corner?: Snippet } = $props();
</script>

<p class="info">
  {#each info as part, i (i)}{#if i > 0}<span class="dot">{' · '}</span>{/if}<span>{part}</span>{/each}
</p>
{#if corner}<div class="corner">{@render corner()}</div>{/if}

<style>
  .info,
  .corner {
    position: absolute;
    top: 0.8rem;
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--gold) 55%, transparent);
  }
  .info {
    left: 1rem;
  }
  .corner {
    right: 1rem;
    text-align: right;
  }

  /* On a narrow table (a phone), in the top corners on two short lines, clear of the player at the top. */
  @container (max-width: 600px) {
    .info,
    .corner {
      top: 0.6rem;
      font-size: 0.62rem;
      line-height: 1.35;
    }
    .info {
      left: 0.75rem;
      display: grid;
    }
    .corner {
      right: 0.75rem;
    }
    .dot {
      display: none;
    }
  }
</style>
