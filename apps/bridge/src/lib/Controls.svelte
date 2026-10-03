<script lang="ts">
  import TableControls from '@card-games/card-kit/TableControls.svelte';
  import { chooseCall, isGameOver, isYourTurn, type Call, type GameState } from '../engine';
  import Auction from './Auction.svelte';
  import BiddingBox from './BiddingBox.svelte';
  import { bidPrompt, gameOverText, statusText } from './labels';
  import ScoreSheet from './ScoreSheet.svelte';

  let {
    game,
    oncall,
    onnext,
    onrestart,
  }: {
    game: GameState;
    oncall: (call: Call) => void;
    onnext: () => void;
    onrestart: () => void;
  } = $props();

  const over = $derived(isGameOver(game) ? gameOverText(game) : null);
  const yourCall = $derived(game.phase === 'bidding' && isYourTurn(game));
</script>

{#snippet sheet()}
  <ScoreSheet {game} />
{/snippet}

{#snippet calling()}
  <div class="calling">
    <p class="table-note">{bidPrompt(game)}</p>
    {#key game.auction.length}
      <BiddingBox {game} suggestion={chooseCall(game)} {oncall} />
    {/key}
  </div>
{/snippet}

<TableControls {over} phase={game.phase} note={statusText(game)} {onnext} {onrestart} {sheet} action={yourCall ? calling : undefined} />
{#if game.phase === 'bidding' || (game.phase === 'settled' && game.auction.length > 0)}
  <div class="auction-spot"><Auction {game} /></div>
{/if}

<style>
  .calling {
    display: grid;
    justify-items: center;
    gap: 0.25rem;
    width: 100%;
  }
  .auction-spot {
    display: flex;
    justify-content: center;
    margin-top: 0.75rem;
  }
</style>
