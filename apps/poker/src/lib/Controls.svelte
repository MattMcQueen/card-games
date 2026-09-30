<script lang="ts">
  import { STARTING_STACK, type GameState, type LegalActions } from '../engine';
  import { gameOverText } from './labels';
  import YourTurn from './YourTurn.svelte';

  let {
    game,
    legal,
    yourTurn,
    over,
    showResults,
    amount,
    onfold,
    oncall,
    onraise,
    onamount,
    onnext,
    onrestart,
  }: {
    game: GameState;
    legal: LegalActions;
    /** It is your turn to act. */
    yourTurn: boolean;
    /** You are out of chips. */
    over: boolean;
    showResults: boolean;
    /** The bet or raise being set up: a total for the street, between the smallest and the whole stack. */
    amount: number;
    onfold: () => void;
    oncall: () => void;
    onraise: () => void;
    onamount: (to: number) => void;
    onnext: () => void;
    onrestart: () => void;
  } = $props();

  const waitingFor = $derived(game.seats[game.toAct]?.name);
  const folded = $derived(game.seats[0]?.folded ?? false);
</script>

<div class="controls">
  {#if over && showResults}
    <p class="over">{gameOverText(game)}</p>
    <button type="button" class="btn primary" onclick={onrestart}>Play again with {STARTING_STACK} chips</button>
  {:else if game.phase === 'settled'}
    {#if showResults}
      <button type="button" class="btn primary" onclick={onnext}>Next hand</button>
    {:else}
      <div class="spacer" aria-hidden="true"></div>
    {/if}
  {:else if yourTurn}
    <YourTurn {game} {legal} {amount} {onfold} {oncall} {onraise} {onamount} />
  {:else}
    <p class="hint" role="status">
      {folded ? 'You folded. The others play the hand out…' : `${waitingFor ?? 'Waiting'} is thinking…`}
    </p>
    <div class="spacer" aria-hidden="true"></div>
  {/if}
</div>

<style>
  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    min-height: 8rem;
    align-content: flex-start;
  }
  .hint,
  .over {
    flex-basis: 100%;
    margin: 0;
    text-align: center;
    font-size: 0.95rem;
    color: var(--muted);
  }
  .over {
    color: var(--fg);
    font-weight: 700;
  }
  .spacer {
    height: 46px;
  }
</style>
