<script lang="ts">
  import { pointsIn, type GameState, type Player } from '../engine';

  let { player, game }: { player: Player; game: GameState } = $props();

  const active = $derived(game.toPlay === player.id);
  const taking = $derived(game.phase === 'collecting' && game.winner === player.id);
  const settled = $derived(game.phase === 'settled');
  /** Points taken in this hand so far, or (once it is scored) what the hand scored, which a moon changes. */
  const points = $derived(settled ? (game.result?.points[player.id] ?? 0) : pointsIn(player.taken));
  const moon = $derived(settled && game.result?.moon === player.id);
</script>

<!-- A player's name plate: the name, the score from earlier hands, and the points taken in this one. -->
<div class="plate name-plate" id="seat-{player.id}" class:you={player.human} class:turn={active} class:glow={taking}>
  <span class="name">{player.name}</span>
  <span class="score" title="Score">{player.score}</span>
  <span class="status" class:hit={points > 0} class:moon>
    {#if moon}
      Shot the moon!
    {:else if points > 0 || settled}
      <svg class="heart" viewBox="0 0 24 24" aria-hidden="true"><use href="#suit-H" /></svg>
      <span>+{points}<span class="sr-only"> {settled ? 'this hand' : 'taken this hand'}</span></span>
    {/if}
  </span>
</div>

<style>
  /* The kit's name plate (app.css), lit up on the player's turn. Yours has a brighter edge when it is not. */
  .you:not(.turn) {
    border-color: color-mix(in srgb, var(--gold) 65%, transparent);
  }
  .name {
    font-size: var(--plate-name, 0.85rem);
    font-weight: 700;
    white-space: nowrap;
  }
  .score {
    font-size: var(--plate-stack, 1rem);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: var(--gold);
  }
  .status {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    min-height: 1.1em;
    font-size: var(--plate-status, 0.72rem);
    font-weight: 700;
    color: color-mix(in srgb, var(--on-felt) 80%, transparent);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .heart {
    width: 0.9em;
    height: 0.9em;
    fill: #ff6b81;
  }
  .status.hit {
    color: var(--on-felt);
  }
  .status.moon {
    padding: 0 0.5rem;
    border-radius: 1rem;
    background: var(--win-bg);
    color: var(--win-fg);
  }
</style>
