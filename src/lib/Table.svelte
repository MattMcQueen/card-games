<script lang="ts">
  import { potSize, type GameState } from '../engine';
  import Board from './Board.svelte';
  import ChipStack from './ChipStack.svelte';
  import SeatView from './SeatView.svelte';
  import Verdict from './Verdict.svelte';

  let {
    game,
    boardFrom,
    revealed,
  }: {
    game: GameState;
    boardFrom: number;
    /** The hand is settled and its result is being shown. */
    revealed: boolean;
  } = $props();

  const settled = $derived(game.phase === 'settled');
  const settling = $derived(settled && !revealed);
  const pot = $derived(potSize(game));
  const inPlay = $derived(!settled || settling);

  // At a showdown, the cards that make the winning hands stand out and the rest fade.
  const faded = $derived.by(() => {
    if (!revealed || !game.showdown) return null;
    const winners = new Set(game.pots.filter((p) => !p.uncalled).flatMap((p) => p.winners));
    const keep = new Set<string>();
    for (const id of winners) {
      for (const c of game.results[id]?.rank?.best ?? []) keep.add(c.rank + c.suit);
    }
    return keep;
  });
</script>

<!-- The table: a walnut rail around green felt, with you at the bottom and the others round it. -->
<div class="rail">
  <div class="felt">
    <p class="info">Hand {game.hand} · Blinds 5/10</p>

    <div class="middle">
      <div class="pot" class:empty={!inPlay || pot === 0} aria-label="Pot: {pot}">
        {#if inPlay && pot > 0}
          <ChipStack amount={pot} />
          <strong>Pot {pot}</strong>
        {/if}
      </div>
      <Board cards={game.board} hand={game.hand} from={boardFrom} {faded} />
      <Verdict {game} {revealed} />
    </div>

    {#each game.seats as seat (seat.id)}
      <div class="slot s{seat.id}">
        <SeatView {seat} {game} {revealed} {settling} {faded} />
      </div>
      {#if seat.bet > 0 && inPlay}
        <div class="bet b{seat.id}">
          <ChipStack amount={seat.bet} />
          <span>{seat.bet}</span>
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .rail {
    container-type: inline-size;
    /* Never taller than the screen leaves room for, so the buttons below stay in view. */
    width: 100%;
    max-width: max(36rem, calc((100dvh - 17rem) * 16 / 11));
    margin-inline: auto;
    padding: clamp(0.5rem, 1.6vw, 0.9rem);
    border-radius: clamp(1.2rem, 4vw, 2.4rem);
    background: linear-gradient(160deg, var(--wood-1), var(--wood-2) 55%, var(--wood-3));
    box-shadow:
      0 10px 30px rgb(0 0 0 / 0.45),
      inset 0 1px 1px rgb(255 255 255 / 0.25);
  }
  .felt {
    position: relative;
    aspect-ratio: 16 / 11;
    overflow: hidden;
    border-radius: clamp(0.8rem, 3vw, 1.7rem);
    color: var(--on-felt);
    background:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .14 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"),
      radial-gradient(ellipse at 50% 45%, var(--felt-1) 0%, var(--felt-2) 55%, var(--felt-3) 100%);
    box-shadow: inset 0 0 40px rgb(0 0 0 / 0.55);

    /* Sizes for everything on the felt, scaled to the table's width. --ch is set again here, as
       it would otherwise keep the value worked out at the root from the root's --cw. */
    --cw: clamp(2.7rem, 8.6cqw, 5.4rem);
    --ch: calc(var(--cw) * 1.455);
    --chip: clamp(1.4rem, 3.6cqw, 2.3rem);
  }
  .info {
    position: absolute;
    left: 1rem;
    bottom: 0.7rem;
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--gold) 55%, transparent);
  }

  .middle {
    position: absolute;
    left: 50%;
    top: 47%;
    display: grid;
    justify-items: center;
    gap: 0.5rem;
    translate: -50% -50%;
  }
  .pot {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    min-height: calc(var(--chip) * 1.6);
    font-size: 1rem;
  }
  .pot strong {
    padding: 0.1rem 0.7rem;
    border-radius: 1rem;
    background: rgb(0 0 0 / 0.45);
    font-variant-numeric: tabular-nums;
  }

  /* Places round the table, clockwise from you at the bottom. --x and --y are the centre of the
     seat; --bx and --by are where the seat's bet goes, between it and the middle. */
  .slot,
  .bet {
    position: absolute;
    translate: -50% -50%;
  }
  .slot {
    left: var(--x);
    top: var(--y);
    --cw: var(--seat-cw, clamp(1.9rem, 5.3cqw, 3.3rem));
    --ch: calc(var(--cw) * 1.455);
  }
  /* A hand name under a seat at the edge of the table grows inwards, so it is not cut off. */
  .s1 :global(.hand-name),
  .s2 :global(.hand-name) {
    left: 0;
    translate: none;
  }
  .s4 :global(.hand-name),
  .s5 :global(.hand-name) {
    right: 0;
    left: auto;
    translate: none;
  }
  .slot.s0 {
    --seat-cw: clamp(3rem, 8cqw, 5rem);
    --plate-w: 8.5rem;
    --plate-name: 0.95rem;
    --plate-stack: 1.15rem;
  }
  .bet {
    left: var(--bx);
    top: var(--by);
    display: flex;
    align-items: flex-end;
    gap: 0.3rem;
    font-size: 0.9rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .bet span {
    padding: 0 0.4rem;
    border-radius: 1rem;
    background: rgb(0 0 0 / 0.45);
  }
  .s0, .b0 { --x: 50%; --y: 80%; --bx: 50%; --by: 64%; }
  .s1, .b1 { --x: 11%; --y: 68%; --bx: 26%; --by: 62%; }
  .s2, .b2 { --x: 11%; --y: 28%; --bx: 26%; --by: 37%; }
  .s3, .b3 { --x: 50%; --y: 16%; --bx: 50%; --by: 29.5%; }
  .s4, .b4 { --x: 89%; --y: 28%; --bx: 74%; --by: 37%; }
  .s5, .b5 { --x: 89%; --y: 68%; --bx: 74%; --by: 62%; }

  /* Narrow tables (phones): taller, with the seats pulled in and everything smaller. */
  @container (max-width: 600px) {
    .felt {
      aspect-ratio: 5 / 7.4;
      min-height: 0;
      --cw: clamp(2.5rem, 13.5cqw, 4rem);
      --chip: clamp(1.2rem, 6cqw, 1.7rem);
    }
    .slot {
      --seat-cw: clamp(1.7rem, 8.5cqw, 2.6rem);
      --plate-w: 5.4rem;
      --plate-name: 0.74rem;
      --plate-stack: 0.9rem;
      --plate-status: 0.66rem;
    }
    .slot.s0 {
      --seat-cw: clamp(2.9rem, 14cqw, 4.2rem);
      --plate-w: 7rem;
      --plate-name: 0.85rem;
      --plate-stack: 1rem;
    }
    .s0, .b0 { --x: 50%; --y: 86%; --bx: 50%; --by: 66%; }
    .s1, .b1 { --x: 15%; --y: 68%; --bx: 33%; --by: 62%; }
    .s2, .b2 { --x: 15%; --y: 33%; --bx: 29%; --by: 43%; }
    .s3, .b3 { --x: 50%; --y: 14%; --bx: 50%; --by: 30%; }
    .s4, .b4 { --x: 85%; --y: 33%; --bx: 71%; --by: 43%; }
    .s5, .b5 { --x: 85%; --y: 68%; --bx: 67%; --by: 62%; }
    /* No room for stacks of chips beside each seat: the amount alone is shown. */
    .slot :global(.hand-name) {
      max-width: 6.5rem;
    }
    .bet :global(.stack) {
      display: none;
    }
    .info {
      display: none;
    }
    .middle {
      top: 46%;
    }
  }
</style>
