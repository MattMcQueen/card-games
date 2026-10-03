<script lang="ts">
  import { teamLabel } from '@card-games/cards-core';
  import { winningTeam, type Entry, type GameState } from '../engine';
  import { resultText, score, teamName } from './labels';

  let { game }: { game: GameState } = $props();

  const leading = $derived(winningTeam(game) ?? (game.teams[0]!.total >= game.teams[1]!.total ? 0 : 1));
  const sum = (entries: readonly Entry[], team: number, below: boolean) =>
    entries.filter((e) => e.team === team && e.below === below).reduce((total, e) => total + e.points, 0);
  const KINDS: Record<Entry['kind'], string> = {
    contract: 'contract',
    overtricks: 'overtricks',
    undertricks: 'undertricks',
    slam: 'slam',
    insult: 'making it doubled',
    honours: 'honours',
    rubber: 'the rubber',
  };
  /** What a hand's points above the line were for: "overtricks, honours". */
  const why = (entries: readonly Entry[], team: number) =>
    entries
      .filter((e) => e.team === team && !e.below)
      .map((e) => KINDS[e.kind])
      .join(', ');

  const hands = $derived(game.history.map((r, hand) => ({ r, hand })));
  /** Above the line, newest first: they are written upwards from the line. */
  const above = $derived(hands.filter(({ r }) => r.entries.some((e) => !e.below)).reverse());
  /** Below the line, in order, with a line under each game. */
  const below = $derived(hands.filter(({ r }) => r.entries.some((e) => e.below)));
</script>

<!-- One side of the line: a row for each hand that scored there, and what each side scored. -->
{#snippet part(rows: typeof hands, isBelow: boolean)}
  <tbody class={isBelow ? 'below' : 'above'}>
    {#each rows as { r, hand } (hand)}
      <tr title="Hand {hand + 1}" class:game-end={isBelow && r.game !== null}>
        {#each [0, 1] as team (team)}
          <td title={isBelow ? undefined : why(r.entries, team)}>{sum(r.entries, team, isBelow) || ''}</td>
        {/each}
      </tr>
    {:else}
      <tr><td></td><td></td></tr>
    {/each}
  </tbody>
{/snippet}

<div class="sheet-wrap">
  <!-- The score sheet of rubber bridge: bonuses and penalties above the line, contract points below it, a line under each game. -->
  <table class="sheet">
    <caption class="sr-only">Scores</caption>
    <thead>
      <tr>
        {#each [0, 1] as team (team)}
          <th scope="col" title={teamName(game, team)}>{teamLabel(team)}</th>
        {/each}
      </tr>
    </thead>
    {@render part(above, false)}
    {@render part(below, true)}
    <tfoot>
      <tr>
        {#each game.teams as team, t (t)}
          <td class:best={leading === t}>{score(team.total)}</td>
        {/each}
      </tr>
    </tfoot>
  </table>

  <ol class="hands" aria-label="The hands">
    {#each game.history as r, hand (hand)}
      <li>{resultText(game, r)}</li>
    {/each}
  </ol>
</div>

<style>
  .sheet-wrap {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: flex-start;
    gap: 0.75rem 2rem;
    width: 100%;
  }
  .sheet {
    width: 14rem;
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
    font-size: 0.9rem;
  }
  th,
  td {
    width: 50%;
    height: 1.5rem;
    padding: 0.15rem 0.6rem;
    text-align: center;
  }
  th + th,
  td + td {
    border-left: 2px solid var(--line);
  }
  thead th {
    color: var(--muted);
    font-weight: 700;
  }
  /* The line: contract points below it, everything else above. */
  .above tr:last-child td {
    border-bottom: 2px solid currentColor;
  }
  /* A game won: a line under the hand that won it. */
  .game-end td {
    border-bottom: 1px solid var(--muted);
  }
  tfoot td {
    border-top: 1px solid var(--line);
    font-weight: 800;
  }
  .best {
    color: var(--accent);
  }
  .hands {
    margin: 0;
    padding-left: 1.6rem;
    font-size: 0.85rem;
    color: var(--muted);
  }
</style>
