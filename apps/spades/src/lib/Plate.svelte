<script lang="ts">
  import { PARTNER_SEAT, type GameState, type Player } from '../engine';
  import { bidText } from './labels';

  let { player, game }: { player: Player; game: GameState } = $props();

  const active = $derived(game.toPlay === player.id);
  const taking = $derived(game.phase === 'collecting' && game.winner === player.id);
  const dealer = $derived(game.dealer === player.id);
  const nil = $derived(player.bid === 0);
  /** A nil bid that has failed, or (once the hand is over) one that was made. */
  const nilFailed = $derived(nil && player.tricks > 0);
  const nilMade = $derived(nil && player.tricks === 0 && game.phase === 'settled');
</script>

<!-- A player's name plate: the name, the tricks taken against the bid, and whether they dealt. -->
<div
  class="plate name-plate"
  id="seat-{player.id}"
  class:ours={player.human || player.id === PARTNER_SEAT}
  class:turn={active}
  class:glow={taking}
>
  <span class="name">{player.name}</span>
  <span class="count">
    {#if player.bid === null}
      <span class="waiting">–</span><span class="sr-only">not bid yet</span>
    {:else}
      {player.tricks}<span class="of">/{bidText(player.bid)}</span>
      <span class="sr-only">taken, bid {bidText(player.bid)}</span>
    {/if}
  </span>
  <span class="status" class:failed={nilFailed} class:made={nilMade}>
    {#if nilFailed}
      Nil failed
    {:else if nilMade}
      Nil made!
    {:else if dealer}
      Dealer
    {/if}
  </span>
</div>

<style>
  /* The kit's name plate (app.css), lit up on the player's turn. You and your partner have a brighter edge. */
  .ours:not(.turn) {
    border-color: color-mix(in srgb, var(--gold) 65%, transparent);
  }
  .name {
    font-size: var(--plate-name, 0.85rem);
    font-weight: 700;
    white-space: nowrap;
  }
  .count {
    font-size: var(--plate-stack, 1rem);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: var(--gold);
    white-space: nowrap;
  }
  .of {
    font-weight: 600;
    opacity: 0.75;
  }
  .waiting {
    opacity: 0.6;
  }
  .status {
    min-height: 1.1em;
    padding: 0 0.5rem;
    border-radius: 1rem;
    font-size: var(--plate-status, 0.72rem);
    font-weight: 700;
    color: color-mix(in srgb, var(--on-felt) 70%, transparent);
    white-space: nowrap;
  }
  .status.failed {
    background: var(--lose-bg);
    color: var(--lose-fg);
  }
  .status.made {
    background: var(--win-bg);
    color: var(--win-fg);
  }
</style>
