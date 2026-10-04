<script lang="ts">
  import { BOT_SEAT, HUMAN_SEAT, type GameState } from '../engine';

  /** The score sheet: what each player pegged in the play, and scored for their hand and crib, every hand. */
  let { game }: { game: GameState } = $props();

  const seats = [HUMAN_SEAT, BOT_SEAT];
  const parts = ['pegging', 'hand', 'crib'] as const;
  const leading = $derived(game.players[HUMAN_SEAT]!.score >= game.players[BOT_SEAT]!.score ? HUMAN_SEAT : BOT_SEAT);
</script>

<table class="score-sheet">
  <caption class="sr-only">Scores</caption>
  <thead>
    <tr>
      <td></td>
      {#each seats as seat (seat)}
        <th scope="colgroup" colspan="3">{game.players[seat]!.name}</th>
      {/each}
    </tr>
    <tr class="sub">
      <th scope="col">Hand</th>
      {#each seats as seat (seat)}
        <th scope="col">Play</th>
        <th scope="col">Hand</th>
        <th scope="col">Crib</th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each game.history as tallies, hand (hand)}
      <tr>
        <th scope="row">{hand + 1}</th>
        {#each seats as seat (seat)}
          {#each parts as part (part)}
            <td class:none={tallies[seat]![part] === 0}>{tallies[seat]![part]}</td>
          {/each}
        {/each}
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr>
      <th scope="row">Score</th>
      {#each seats as seat (seat)}
        <td colspan="3" class:best={leading === seat}>{game.players[seat]!.score}</td>
      {/each}
    </tr>
  </tfoot>
</table>

<style>
  .none {
    color: var(--muted);
  }
</style>
