<script lang="ts">
  import CornerScores from '@card-games/card-kit/CornerScores.svelte';
  import { teamLabel, teamName } from '@card-games/cards-core';
  import { isVulnerable, type GameState } from '../engine';
  import { score } from './labels';

  let { game }: { game: GameState } = $props();
</script>

<!-- In the corner of the table: each partnership's points so far, the games it has won, and whether it is vulnerable. -->
<CornerScores teams={game.teams.map((_, t) => ({ label: teamLabel(t), title: teamName(game.players, t) }))}>
  {#snippet value(t: number)}
    {@const team = game.teams[t]!}
    <span class="score">{score(team.total)}</span>
    <span class="games" aria-label="{team.games} {team.games === 1 ? 'game' : 'games'}">{'●'.repeat(team.games)}{'○'.repeat(2 - team.games)}</span>
    {#if isVulnerable(game, t)}<span class="vul">vulnerable</span>{/if}
  {/snippet}
</CornerScores>

<style>
  .games {
    letter-spacing: 0.1em;
  }
  /* On a narrow table (a phone), no room to say who is vulnerable: the games show it. */
  @container (max-width: 600px) {
    .vul {
      display: none;
    }
  }
</style>
