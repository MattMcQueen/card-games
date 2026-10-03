<script lang="ts">
  import TableControls from '@card-games/card-kit/TableControls.svelte';
  import { HUMAN_SEAT, estimateTricks, isGameOver, type GameState } from '../engine';
  import BidPicker from './BidPicker.svelte';
  import { bidPrompt, gameOverText, statusText } from './labels';
  import ScoreSheet from './ScoreSheet.svelte';

  let {
    game,
    onbid,
    onnext,
    onrestart,
  }: {
    game: GameState;
    onbid: (tricks: number) => void;
    onnext: () => void;
    onrestart: () => void;
  } = $props();

  const over = $derived(isGameOver(game) ? gameOverText(game) : null);
  const yourBid = $derived(game.phase === 'bidding' && game.toPlay === HUMAN_SEAT);
  /** What a computer player would bid with your cards, as a start. */
  const suggestion = $derived(Math.floor(estimateTricks(game.players[HUMAN_SEAT]!.hand)));
</script>

{#snippet sheet()}
  <ScoreSheet {game} />
{/snippet}

{#snippet bidding()}
  <p class="table-note">{bidPrompt(game)}</p>
  {#key game.hand}
    <BidPicker {suggestion} {onbid} />
  {/key}
{/snippet}

<TableControls {over} phase={game.phase} note={statusText(game)} {onnext} {onrestart} {sheet} action={yourBid ? bidding : undefined} />
