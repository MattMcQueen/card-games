<script lang="ts">
  import { HUMAN_SEAT, PASS_SIZE, isGameOver, type GameState } from '../engine';
  import { gameOverText, passText, trickText, turnText } from './labels';
  import ScoreSheet from './ScoreSheet.svelte';

  let {
    game,
    chosen,
    onpass,
    onnext,
    onrestart,
  }: {
    game: GameState;
    /** How many cards are chosen to pass. */
    chosen: number;
    onpass: () => void;
    onnext: () => void;
    onrestart: () => void;
  } = $props();

  const over = $derived(isGameOver(game));
  const waitingFor = $derived(game.players[game.toPlay]?.name);
</script>

<div class="controls">
  {#if over}
    <p class="table-note over">{gameOverText(game)}</p>
    <button type="button" class="btn primary" onclick={onrestart}>Play again</button>
  {:else if game.phase === 'settled'}
    <button type="button" class="btn primary" onclick={onnext}>Next hand</button>
  {:else if game.phase === 'passing'}
    <p class="table-note">Choose {PASS_SIZE} cards to pass to {passText(game)}.</p>
    <button type="button" class="btn primary" disabled={chosen !== PASS_SIZE} onclick={onpass}>
      {chosen === PASS_SIZE ? `Pass ${PASS_SIZE} cards` : `${chosen} of ${PASS_SIZE} chosen`}
    </button>
  {:else}
    <p class="table-note" role="status">
      {#if game.phase === 'collecting'}
        {trickText(game)}
      {:else if game.toPlay === HUMAN_SEAT}
        {turnText(game)}
      {:else}
        {waitingFor ?? 'Waiting'} is thinking…
      {/if}
    </p>
    <div class="button-space" aria-hidden="true"></div>
  {/if}
  {#if game.phase === 'settled'}
    <ScoreSheet {game} />
  {/if}
</div>

<style>
  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    align-content: flex-start;
    gap: 0.75rem;
    min-height: 6rem;
  }
</style>
