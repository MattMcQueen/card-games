<script lang="ts">
  import TableControls from '@card-games/card-kit/TableControls.svelte';
  import { DISCARDS, HUMAN_SEAT, currentShow, isGameOver, mustGo, type GameState } from '../engine';
  import Counting from './Counting.svelte';
  import { cutText, discardText, gameOverText, nextCountText, statusText } from './labels';
  import ScoreSheet from './ScoreSheet.svelte';

  let {
    game,
    chosen,
    ondiscard,
    ongo,
    oncount,
    onnext,
    onrestart,
  }: {
    game: GameState;
    /** How many cards you have chosen for the crib. */
    chosen: number;
    ondiscard: () => void;
    ongo: () => void;
    oncount: () => void;
    onnext: () => void;
    onrestart: () => void;
  } = $props();

  const over = $derived(isGameOver(game) ? gameOverText(game) : null);
  const show = $derived(currentShow(game));
  const sayGo = $derived(game.phase === 'pegging' && game.toPlay === HUMAN_SEAT && mustGo(game));
  const action = $derived(game.phase === 'discarding' ? discarding : game.phase === 'showing' ? showing : sayGo ? going : undefined);
</script>

{#snippet sheet()}
  {#if show}<Counting {game} {show} />{/if}
  <ScoreSheet {game} />
{/snippet}

{#snippet discarding()}
  <p class="table-note">{cutText(game)} {discardText(game)}</p>
  <button type="button" class="btn primary" disabled={chosen !== DISCARDS} onclick={ondiscard}>
    {chosen === DISCARDS ? 'Put them in the crib' : `${chosen} of ${DISCARDS} chosen`}
  </button>
{/snippet}

{#snippet going()}
  <p class="table-note">{statusText(game)}</p>
  <button type="button" class="btn primary" onclick={ongo}>Go</button>
{/snippet}

<!-- The button first, straight under the table, as the count can run to a few lines on a phone. -->
{#snippet showing()}
  <button type="button" class="btn primary" onclick={oncount}>{nextCountText(game)}</button>
  {#if show}<Counting {game} {show} />{/if}
{/snippet}

<TableControls {over} phase={game.phase} note={statusText(game)} {onnext} {onrestart} {sheet} {action} />
