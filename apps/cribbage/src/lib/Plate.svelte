<script lang="ts">
  import SeatPlate from '@card-games/card-kit/SeatPlate.svelte';
  import type { GameState, Player } from '../engine';

  /** A player's name plate: their score, and whether they dealt or have said go. */
  let { player, game }: { player: Player; game: GameState } = $props();

  const table = $derived({ toPlay: game.toPlay, phase: game.phase, winner: game.lastPlayer });
</script>

<SeatPlate {player} partner={-1} {table}>
  {#snippet count()}
    <span class="peg" class:yours={player.human} aria-hidden="true"></span>{player.score}<span class="sr-only"> points</span>
  {/snippet}
  {#snippet status()}
    {#if game.phase === 'pegging' && game.go[player.id]}
      Go
    {:else if game.dealer === player.id}
      Dealer
    {/if}
  {/snippet}
</SeatPlate>

<style>
  /* The colour of the player's pegs on the board. */
  .peg {
    display: inline-block;
    width: 0.55em;
    height: 0.55em;
    margin-right: 0.3em;
    border-radius: 50%;
    background: #9fd3ff;
    vertical-align: 0.1em;
  }
  .peg.yours {
    background: var(--highlight);
  }
</style>
