<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * A player's name plate at a table of two partnerships (Spades, Bridge): the name, a `count` (such as the tricks
   * taken against those needed) and a `status` line, which can be good or bad news (`tone`). You and your `partner`
   * have a brighter edge. It lights up, pulsing, on the player's turn at the `table`, and glows while they take a trick.
   */
  let {
    player,
    partner,
    table,
    tone = null,
    count,
    status,
  }: {
    player: { readonly id: number; readonly name: string; readonly human: boolean };
    partner: number;
    table: { readonly toPlay: number; readonly phase: string; readonly winner: number };
    tone?: 'good' | 'bad' | null;
    count: Snippet;
    status: Snippet;
  } = $props();

  const ours = $derived(player.human || player.id === partner);
  const turn = $derived(table.toPlay === player.id);
  const glow = $derived(table.phase === 'collecting' && table.winner === player.id);
</script>

<div class="plate name-plate" id="seat-{player.id}" class:ours class:turn class:glow>
  <span class="name">{player.name}</span>
  <span class="count">{@render count()}</span>
  <span class="status" class:good={tone === 'good'} class:bad={tone === 'bad'}>{@render status()}</span>
</div>

<style>
  /* The kit's name plate (app.css). */
  .ours:not(.turn) {
    border-color: color-mix(in srgb, var(--gold) 65%, transparent);
  }
  .name {
    font-size: var(--plate-name, 0.85rem);
    font-weight: 700;
    white-space: nowrap;
  }
  .count {
    font-size: var(--plate-stack, 1rem);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: var(--gold);
    white-space: nowrap;
  }
  /* "/7" after the tricks taken, and the dash before a player has bid. */
  .count :global(.of) {
    font-weight: 600;
    opacity: 0.75;
  }
  .count :global(.waiting) {
    opacity: 0.6;
  }
  .status {
    min-height: 1.1em;
    padding: 0 0.5rem;
    border-radius: 1rem;
    font-size: var(--plate-status, 0.72rem);
    font-weight: 700;
    color: color-mix(in srgb, var(--on-felt) 70%, transparent);
    white-space: nowrap;
  }
  .bad {
    background: var(--lose-bg);
    color: var(--lose-fg);
  }
  .good {
    background: var(--win-bg);
    color: var(--win-fg);
  }
</style>
