<script lang="ts">
  import { winningTeam, type GameState, type TeamResult } from '../engine';
  import { teamLabel } from '@card-games/cards-core';
  import { score, signed, teamName } from './labels';

  let { game }: { game: GameState } = $props();

  const leading = $derived(winningTeam(game) ?? (game.teams[0]!.score >= game.teams[1]!.score ? 0 : 1));
  const bid = (r: TeamResult) => (r.nil === 0 ? String(r.bid) : `${r.bid} + nil`);
</script>

<!-- The score sheet: each partnership's bid, tricks and points in every hand, and the totals. -->
<table class="sheet">
  <caption class="sr-only">Scores</caption>
  <thead>
    <tr>
      <td></td>
      {#each [0, 1] as team (team)}
        <th scope="colgroup" colspan="3" title={teamName(game, team)}>{teamLabel(team)}</th>
      {/each}
    </tr>
    <tr class="sub">
      <th scope="col">Hand</th>
      {#each [0, 1] as team (team)}
        <th scope="col">Bid</th>
        <th scope="col">Took</th>
        <th scope="col">Points</th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each game.history as results, hand (hand)}
      <tr>
        <th scope="row">{hand + 1}</th>
        {#each results as r, team (team)}
          <td>{bid(r)}</td>
          <td>{r.tricks}</td>
          <td class="points" class:minus={r.points < 0}>{signed(r.points)}</td>
        {/each}
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr>
      <th scope="row">Total</th>
      {#each game.teams as team, t (t)}
        <td colspan="2" class="bags">{team.bags} {team.bags === 1 ? 'bag' : 'bags'}</td>
        <td class:best={leading === t}>{score(team.score)}</td>
      {/each}
    </tr>
  </tfoot>
</table>

<style>
  .sheet {
    width: 100%;
    max-width: 30rem;
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
    font-size: 0.9rem;
  }
  th,
  td {
    padding: 0.25rem 0.4rem;
    border-bottom: 1px solid var(--line);
    text-align: center;
  }
  thead th {
    color: var(--muted);
    font-weight: 700;
  }
  .sub th {
    font-size: 0.75rem;
    font-weight: 600;
  }
  tbody th {
    color: var(--muted);
    font-weight: 600;
  }
  .points {
    font-weight: 700;
  }
  .minus {
    color: var(--muted);
  }
  .bags {
    color: var(--muted);
    font-size: 0.8rem;
    font-weight: 600;
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
