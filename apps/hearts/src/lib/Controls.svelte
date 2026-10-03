<script lang="ts">
  import TableControls from '@card-games/card-kit/TableControls.svelte';
  import { PASS_SIZE, isGameOver, type GameState } from '../engine';
  import { gameOverText, passText, statusText } from './labels';
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

  const over = $derived(isGameOver(game) ? gameOverText(game) : null);
</script>

{#snippet sheet()}
  <ScoreSheet {game} />
{/snippet}

{#snippet passing()}
  <p class="table-note">Choose {PASS_SIZE} cards to pass to {passText(game)}.</p>
  <button type="button" class="btn primary" disabled={chosen !== PASS_SIZE} onclick={onpass}>
    {chosen === PASS_SIZE ? `Pass ${PASS_SIZE} cards` : `${chosen} of ${PASS_SIZE} chosen`}
  </button>
{/snippet}

<TableControls {over} phase={game.phase} note={statusText(game)} {onnext} {onrestart} {sheet} action={game.phase === 'passing' ? passing : undefined} />
