<script lang="ts">
  import { SEATS, type GameState, type Seat } from '../engine';
  import HoleCards from './HoleCards.svelte';
  import { seatStatus } from './labels';

  let {
    seat,
    game,
    revealed,
    settling,
    faded,
  }: {
    seat: Seat;
    game: GameState;
    /** The hand is settled and its result is being shown. */
    revealed: boolean;
    /** The hand is settled but the board is still being dealt: winnings are not paid out on screen yet. */
    settling: boolean;
    /** Cards to dim at a showdown: those that are not part of a winning hand. */
    faded: ReadonlySet<string> | null;
  } = $props();

  const you = $derived(seat.human);
  const order = $derived((seat.id - game.button - 1 + SEATS) % SEATS);
  const dealt = $derived(seat.hole.length > 0);
  const active = $derived(game.phase === 'action' && game.toAct === seat.id);
  const result = $derived(revealed ? game.results[seat.id] : undefined);
  const showCards = $derived(you || (revealed && game.showdown && !seat.folded));
  const winner = $derived(!!result && game.pots.some((p) => !p.uncalled && p.winners.includes(seat.id)));
  const sittingOut = $derived(seat.folded && !dealt);

  // Winnings appear in the stack only once the hand's result is shown.
  const stack = $derived(settling ? seat.chips - (game.results[seat.id]?.won ?? 0) : seat.chips);

  const status = $derived(seatStatus(seat, result));
  const handName = $derived(result?.rank?.name ?? '');
</script>

<div class="seat" class:you class:folded={seat.folded} class:active class:winner class:out={sittingOut}>
  <HoleCards cards={seat.hole} hand={game.hand} {order} showFaces={showCards} ownCards={you} folded={seat.folded} {faded} />

  <div class="plate">
    <span class="name">
      {#if game.button === seat.id}<span class="badge dealer" title="Dealer button">D</span>{/if}
      {seat.name}
      {#if dealt && game.smallBlind === seat.id}<span class="badge blind" title="Small blind">SB</span>{/if}
      {#if dealt && game.bigBlind === seat.id}<span class="badge blind" title="Big blind">BB</span>{/if}
    </span>
    <span class="stack">{sittingOut ? 'Out' : stack}</span>
    <span class="status" class:won={!!result && result.net > 0} class:folded={seat.folded && !result}>{status}</span>
  </div>

  {#if handName && !you}
    <span class="hand-name">{handName}</span>
  {/if}
</div>

<style>
  .seat {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 0.25rem;
    transition: opacity 0.3s;
  }
  .plate {
    display: grid;
    justify-items: center;
    gap: 0;
    min-width: var(--plate-w, 6.8rem);
    padding: 0.25rem 0.6rem 0.3rem;
    border: 2px solid color-mix(in srgb, var(--gold) 30%, transparent);
    border-radius: 0.8rem;
    background: rgb(12 22 18 / 0.78);
    color: var(--on-felt);
    line-height: 1.2;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .active .plate {
    border-color: var(--highlight);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--highlight) 45%, transparent);
    animation: pulse 1.4s ease-in-out infinite;
  }
  .winner .plate {
    border-color: var(--highlight);
    background: color-mix(in srgb, var(--highlight) 22%, rgb(12 22 18 / 0.85));
    box-shadow: 0 0 1.2rem color-mix(in srgb, var(--highlight) 60%, transparent);
  }
  .you .plate {
    border-color: color-mix(in srgb, var(--gold) 65%, transparent);
  }
  .folded .plate,
  .out .plate {
    opacity: 0.6;
  }
  .name {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--plate-name, 0.85rem);
    font-weight: 700;
    white-space: nowrap;
  }
  .stack {
    font-size: var(--plate-stack, 1rem);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: var(--gold);
  }
  .status {
    min-height: 1.1em;
    font-size: var(--plate-status, 0.72rem);
    font-weight: 700;
    letter-spacing: 0.02em;
    color: color-mix(in srgb, var(--on-felt) 80%, transparent);
    white-space: nowrap;
  }
  .status.folded {
    color: color-mix(in srgb, var(--on-felt) 55%, transparent);
  }
  .status.won {
    padding: 0 0.5rem;
    border-radius: 1rem;
    background: var(--win-bg);
    color: var(--win-fg);
    animation: pop 0.35s cubic-bezier(0.2, 1.4, 0.4, 1) both;
  }
  .badge {
    display: inline-grid;
    place-items: center;
    min-width: 1.15rem;
    height: 1.15rem;
    padding: 0 0.2rem;
    border-radius: 999px;
    font-size: 0.62rem;
    font-weight: 800;
  }
  .dealer {
    background: #fff;
    color: #111;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.5);
  }
  .blind {
    background: color-mix(in srgb, var(--gold) 85%, transparent);
    color: #2b2100;
  }
  .hand-name {
    position: absolute;
    top: 100%;
    left: 50%;
    z-index: 2;
    width: max-content;
    max-width: 8.5rem;
    margin-top: 0.15rem;
    padding: 0.1rem 0.5rem;
    border-radius: 0.6rem;
    background: rgb(0 0 0 / 0.65);
    color: var(--on-felt);
    font-size: 0.72rem;
    font-weight: 600;
    line-height: 1.25;
    text-align: center;
    translate: -50% 0;
    animation: pop 0.35s cubic-bezier(0.2, 1.4, 0.4, 1) both;
  }
  @keyframes pulse {
    50% {
      box-shadow: 0 0 0 5px color-mix(in srgb, var(--highlight) 15%, transparent);
    }
  }
  @keyframes pop {
    from {
      transform: scale(0.6);
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .active .plate,
    .status.won,
    .hand-name {
      animation: none;
    }
  }
</style>
