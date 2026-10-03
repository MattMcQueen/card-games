<script lang="ts">
  import CornerScores from '@card-games/card-kit/CornerScores.svelte';
  import { teamLabel, teamName } from '@card-games/cards-core';
  import type { GameState } from '../engine';
  import { score } from './labels';

  let { game }: { game: GameState } = $props();
</script>

<!-- In the corner of the table: each partnership's score and bags, yours first. -->
<CornerScores teams={game.teams.map((_, t) => ({ label: teamLabel(t), title: teamName(game.players, t) }))}>
  {#snippet value(t: number)}
    {@const team = game.teams[t]!}
    <span class="score">{score(team.score)}</span><span class="bags">{' · '}{team.bags} {team.bags === 1 ? 'bag' : 'bags'}</span>
  {/snippet}
</CornerScores>

<style>
  /* On a narrow table (a phone), only the scores: the bags are on the score sheet. */
  @container (max-width: 600px) {
    .bags {
      display: none;
    }
  }
</style>
