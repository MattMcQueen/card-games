<script lang="ts">
  import SeatPlate from '@card-games/card-kit/SeatPlate.svelte';
  import { PARTNER_SEAT, type GameState, type Player } from '../engine';
  import { callText, callWords, lastCallOf, roleOf, sideCount } from './labels';

  let { player, game }: { player: Player; game: GameState } = $props();

  const call = $derived(lastCallOf(game, player.id));
  const red = $derived(call?.kind === 'bid' && (call.strain === 'H' || call.strain === 'D'));
  const role = $derived(roleOf(game, player.id));
</script>

<!-- A player's name plate: their last call (or their side's tricks against what it needs), and their part in the hand. -->
<SeatPlate {player} partner={PARTNER_SEAT} table={game}>
  {#snippet count()}
    {#if game.phase === 'bidding'}
      {#if call}
        <span class:red aria-hidden="true">{callText(call)}</span><span class="sr-only">said {callWords(call)}</span>
      {:else}
        <span class="waiting">–</span><span class="sr-only">no call yet</span>
      {/if}
    {:else if game.contract}
      {@const { took, need } = sideCount(game, player.id)}
      {took}<span class="of">/{need}</span>
      <span class="sr-only">tricks taken by their side, of {need} needed</span>
    {/if}
  {/snippet}
  {#snippet status()}
    {#if role}
      {role}
    {:else if game.phase === 'bidding' && game.dealer === player.id}
      Dealer
    {/if}
  {/snippet}
</SeatPlate>

<style>
  /* Hearts and diamonds in a call, in a red that reads on the felt. */
  .red {
    color: #ff9c8f;
  }
</style>
