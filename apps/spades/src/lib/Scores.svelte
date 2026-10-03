<script lang="ts">
  import type { GameState } from '../engine';
  import { score, teamLabel, teamName } from './labels';

  let { game }: { game: GameState } = $props();
</script>

<!-- In the corner of the table: each partnership's score and bags, yours first. -->
<dl class="scores">
  {#each game.teams as team, t (t)}
    <div title={teamName(game, t)}>
      <dt>{teamLabel(t)}</dt>
      <dd>
        <span class="score">{score(team.score)}</span><span class="bags">{' · '}{team.bags} {team.bags === 1 ? 'bag' : 'bags'}</span>
      </dd>
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
  .score {
    color: var(--gold);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
  /* On a narrow table (a phone), only the scores: the bags are on the score sheet. */
  @container (max-width: 600px) {
    .bags {
      display: none;
    }
  }
</style>
