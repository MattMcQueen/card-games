<script lang="ts">
  import { potSize, type GameState, type LegalActions } from '../engine';
  import BetSizer from './BetSizer.svelte';

  let {
    game,
    legal,
    amount,
    onfold,
    oncall,
    onraise,
    onamount,
  }: {
    game: GameState;
    legal: LegalActions;
    /** The bet or raise being set up: a total for the street, between the smallest and the whole stack. */
    amount: number;
    onfold: () => void;
    oncall: () => void;
    onraise: () => void;
    onamount: (to: number) => void;
  } = $props();

  const pot = $derived(potSize(game));
  const opening = $derived(game.currentBet === 0);
  const raiseLabel = $derived(
    amount >= legal.maxRaiseTo ? `All-in ${amount}` : opening ? `Bet ${amount}` : `Raise to ${amount}`,
  );
</script>

<p class="hint">Your turn: {legal.canCall ? `${legal.toCall} to call` : 'check or bet'} · pot {pot}</p>
<div class="actions">
  <button type="button" class="btn" onclick={onfold} title="Fold (F)" aria-keyshortcuts="F">Fold</button>
  <button type="button" class="btn" onclick={oncall} title="{legal.canCall ? 'Call' : 'Check'} (C)" aria-keyshortcuts="C">
    {legal.canCall ? `Call ${legal.toCall}` : 'Check'}
  </button>
  {#if legal.canRaise}
    <button type="button" class="btn primary" onclick={onraise} title="{opening ? 'Bet' : 'Raise'} (R)" aria-keyshortcuts="R">{raiseLabel}</button>
  {/if}
</div>
{#if legal.canRaise}
  <BetSizer {game} {legal} {amount} {onamount} />
{/if}

<style>
  .hint {
    flex-basis: 100%;
    margin: 0;
    text-align: center;
    font-size: 0.95rem;
    color: var(--muted);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.6rem;
  }
  .actions .btn {
    min-width: 6.4rem;
  }
  .actions .btn.primary {
    min-width: 9rem;
  }
  /* On a phone Fold, Call and Raise fit on one row, even as "Call 1000" and "Raise to 1000". */
  @media (max-width: 480px) {
    .actions {
      gap: 0.5rem;
    }
    .actions .btn {
      min-width: 5rem;
      padding-inline: 16px;
    }
    .actions .btn.primary {
      min-width: 7.5rem;
    }
  }
</style>
