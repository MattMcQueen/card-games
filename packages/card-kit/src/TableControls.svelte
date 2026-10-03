<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * Under the table of a trick-taking game: how the game ended (`over`) and Play again; Next hand once the hand's
   * `phase` is 'settled'; otherwise the game's own `action` (such as passing or bidding), if it has one now, or else the `note`
   * saying whose turn it is. The `sheet` of scores shows once a hand is over.
   */
  let {
    over,
    phase,
    note,
    onnext,
    onrestart,
    sheet,
    action,
  }: {
    over: string | null;
    phase: string;
    note: string;
    onnext: () => void;
    onrestart: () => void;
    sheet: Snippet;
    action?: Snippet;
  } = $props();

  const settled = $derived(phase === 'settled');
</script>

<div class="controls">
  {#if over !== null}
    <p class="table-note over">{over}</p>
    <button type="button" class="btn primary" onclick={onrestart}>Play again</button>
  {:else if settled}
    <button type="button" class="btn primary" onclick={onnext}>Next hand</button>
  {:else if action}
    {@render action()}
  {:else}
    <p class="table-note" role="status">{note}</p>
    <div class="button-space" aria-hidden="true"></div>
  {/if}
  {#if settled}
    {@render sheet()}
  {/if}
</div>

<style>
  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    align-content: flex-start;
    gap: 0.75rem;
    min-height: 6rem;
  }
</style>
