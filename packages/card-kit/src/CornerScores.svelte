<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * In the corner of a table of two partnerships (Spades, Bridge): each side's short `label` ("Us", "Them"), with its
   * full name as a `title`, and its `value`. A number in the value with the class `score` is in gold.
   */
  let { teams, value }: { teams: readonly { label: string; title: string }[]; value: Snippet<[number]> } = $props();
</script>

<dl class="scores">
  {#each teams as team, t (t)}
    <div title={team.title}>
      <dt>{team.label}</dt>
      <dd>{@render value(t)}</dd>
    </div>
  {/each}
</dl>

<style>
  .scores {
    display: grid;
    gap: 0.1rem;
    margin: 0;
  }
  .scores div {
    display: flex;
    justify-content: flex-end;
    gap: 0.4rem;
  }
  dd {
    margin: 0;
  }
  dd :global(.score) {
    color: var(--gold);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
</style>
