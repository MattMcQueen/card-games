<script lang="ts">
  import { STARTING_STACK, potSize, type GameState, type LegalActions } from '../engine';

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

  const pot = $derived(potSize(game));
  const opening = $derived(game.currentBet === 0);
  const allIn = $derived(amount >= legal.maxRaiseTo);
  const raiseLabel = $derived(allIn ? `All-in ${amount}` : opening ? `Bet ${amount}` : `Raise to ${amount}`);
  const waitingFor = $derived(game.seats[game.toAct]?.name);
  const folded = $derived(game.seats[0]?.folded ?? false);

  /** A bet of a share of the pot: raising by that much once you have called, rounded to a 5. */
  function sized(share: number): number {
    const to = Math.round((game.currentBet + share * (pot + legal.toCall)) / 5) * 5;
    return Math.min(legal.maxRaiseTo, Math.max(legal.minRaiseTo, to));
  }
  const sizes = $derived([
    { label: 'Min', to: legal.minRaiseTo },
    { label: '½ pot', to: sized(0.5) },
    { label: '¾ pot', to: sized(0.75) },
    { label: 'Pot', to: sized(1) },
    { label: 'All-in', to: legal.maxRaiseTo },
  ]);
</script>

<div class="controls">
  {#if over && showResults}
    <p class="over">Game over: you are out of chips.</p>
    <button type="button" class="btn primary" onclick={onrestart}>Play again with {STARTING_STACK} chips</button>
  {:else if game.phase === 'settled'}
    {#if showResults}
      <button type="button" class="btn primary" onclick={onnext}>Next hand</button>
    {:else}
      <div class="spacer" aria-hidden="true"></div>
    {/if}
  {:else if yourTurn}
    <p class="hint">
      Your turn: {legal.canCall ? `${legal.toCall} to call` : 'check or bet'} · pot {pot}
    </p>
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
      <div class="sizer">
        <div class="presets">
          {#each sizes as { label, to } (label)}
            <button type="button" class="btn quiet" class:on={amount === to} onclick={() => onamount(to)} title="{label}: {to}">{label}</button>
          {/each}
        </div>
        <label class="slider">
          <span class="sr-only">{opening ? 'Bet' : 'Raise to'} amount</span>
          <input
            type="range"
            min={legal.minRaiseTo}
            max={legal.maxRaiseTo}
            step="1"
            value={amount}
            disabled={legal.minRaiseTo === legal.maxRaiseTo}
            oninput={(e) => onamount(e.currentTarget.valueAsNumber)}
          />
          <output>{amount}</output>
        </label>
      </div>
    {/if}
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
  .spacer {
    height: 46px;
  }
  .sizer {
    display: flex;
    flex-basis: 100%;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.4rem 1rem;
  }
  .presets {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.35rem;
  }
  .presets .btn {
    min-height: 34px;
    padding: 0 12px;
    font-size: 0.85rem;
  }
  .presets .btn.on {
    border-color: var(--accent);
    color: var(--accent);
  }
  .slider {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: min(20rem, 100%);
  }
  .slider input {
    flex: 1;
    min-width: 0;
    accent-color: var(--accent);
  }
  .slider output {
    min-width: 3.2rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
</style>
