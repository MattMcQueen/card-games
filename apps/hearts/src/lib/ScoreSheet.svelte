<script lang="ts">
  import { leaders, type GameState } from '../engine';

  let { game }: { game: GameState } = $props();

  const best = $derived(new Set(leaders(game)));
</script>

<!-- The score sheet: every hand's points, and the totals. The lowest total is leading. -->
<table class="sheet">
  <caption class="sr-only">Scores</caption>
  <thead>
    <tr>
      <th scope="col">Hand</th>
      {#each game.players as player (player.id)}<th scope="col">{player.name}</th>{/each}
    </tr>
  </thead>
  <tbody>
    {#each game.history as points, hand (hand)}
      <tr>
        <th scope="row">{hand + 1}</th>
        {#each points as p, seat (seat)}<td class:zero={p === 0}>{p}</td>{/each}
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr>
      <th scope="row">Total</th>
      {#each game.players as player (player.id)}<td class:best={best.has(player.id)}>{player.score}</td>{/each}
    </tr>
  </tfoot>
</table>

<style>
  .sheet {
    width: 100%;
    max-width: 28rem;
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
    font-size: 0.9rem;
  }
  th,
  td {
    padding: 0.25rem 0.5rem;
    border-bottom: 1px solid var(--line);
    text-align: center;
  }
  thead th {
    color: var(--muted);
    font-weight: 700;
  }
  tbody th {
    color: var(--muted);
    font-weight: 600;
  }
  .zero {
    color: var(--muted);
  }
  tfoot th,
  tfoot td {
    border-bottom: 0;
    font-weight: 800;
  }
  .best {
    color: var(--accent);
  }
</style>
