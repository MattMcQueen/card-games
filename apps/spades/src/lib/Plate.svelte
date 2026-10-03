<script lang="ts">
  import SeatPlate from '@card-games/card-kit/SeatPlate.svelte';
  import { PARTNER_SEAT, type GameState, type Player } from '../engine';
  import { bidText } from './labels';

  let { player, game }: { player: Player; game: GameState } = $props();

  const nil = $derived(player.bid === 0);
  /** A nil bid that has failed, or (once the hand is over) one that was made. */
  const nilFailed = $derived(nil && player.tricks > 0);
  const nilMade = $derived(nil && player.tricks === 0 && game.phase === 'settled');
</script>

<!-- A player's name plate: the name, the tricks taken against the bid, and whether they dealt. -->
<SeatPlate {player} partner={PARTNER_SEAT} table={game} tone={nilFailed ? 'bad' : nilMade ? 'good' : null}>
  {#snippet count()}
    {#if player.bid === null}
      <span class="waiting">–</span><span class="sr-only">not bid yet</span>
    {:else}
      {player.tricks}<span class="of">/{bidText(player.bid)}</span>
      <span class="sr-only">taken, bid {bidText(player.bid)}</span>
    {/if}
  {/snippet}
  {#snippet status()}
    {#if nilFailed}
      Nil failed
    {:else if nilMade}
      Nil made!
    {:else if game.dealer === player.id}
      Dealer
    {/if}
  {/snippet}
</SeatPlate>
