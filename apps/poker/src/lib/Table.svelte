<script lang="ts">
  import CardPile from '@card-games/card-kit/CardPile.svelte';
  import ChipStack from '@card-games/card-kit/ChipStack.svelte';
  import { chipSet } from './chips';
  import { potSize, type GameState } from '../engine';
  import Board from './Board.svelte';
  import SeatView from './SeatView.svelte';
  import Verdict from './Verdict.svelte';
  import { winningCards } from './verdict';

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
  const faded = $derived(winningCards(game, revealed));
</script>

<!-- The table: a walnut rail around green felt, with you at the bottom and the others round it. -->
<div class="rail">
  <div class="felt">
    <!-- The deck, where dealt cards fly out from. -->
    <div class="deck-spot"><CardPile id="deck" /></div>
    <p class="info"><span>Hand {game.hand}</span><span class="dot"> · </span><span>Blinds {game.blinds.small}/{game.blinds.big}</span></p>

    <div class="middle">
      <div class="pot" class:empty={!inPlay || pot === 0} aria-label="Pot: {pot}">
        {#if inPlay && pot > 0}
          <ChipStack amount={pot} set={chipSet} />
          <strong>Pot {pot}</strong>
        {/if}
        <Verdict {game} {revealed} />
      </div>
      <Board cards={game.board} hand={game.hand} from={boardFrom} {faded} />
    </div>

    {#each game.seats as seat (seat.id)}
      <div class="slot s{seat.id}">
        <SeatView {seat} {game} {revealed} {settling} {faded} />
        {#if seat.bet > 0 && inPlay}
          <div class="bet">
            <ChipStack amount={seat.bet} set={chipSet} />
            <span>{seat.bet}</span>
          </div>
        {/if}
      </div>
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

  /* The deck in the top right corner, where every card is dealt from. */
  .deck-spot {
    position: absolute;
    top: 0.8rem;
    right: 1rem;
    --cw: clamp(1.9rem, 4.2cqw, 2.8rem);
    --ch: calc(var(--cw) * 1.455);
  }
  .middle {
    position: absolute;
    left: 50%;
    top: 46%;
    display: grid;
    justify-items: center;
    gap: 0.5rem;
    translate: -50% -50%;
  }
  .pot {
    position: relative;
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    min-height: max(calc(var(--chip) * 1.6), 4rem);
    font-size: 1rem;
  }
  .pot strong {
    padding: 0.1rem 0.7rem;
    border-radius: 1rem;
    background: rgb(0 0 0 / 0.45);
    font-variant-numeric: tabular-nums;
  }

  /* Places round the table, clockwise from you at the bottom. --x and --y are the centre of the seat. */
  .slot {
    position: absolute;
    translate: -50% -50%;
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
  /* The top seat's hand name goes beside its plate, out of the way of the result banner. */
  .s3 :global(.hand-name) {
    top: auto;
    bottom: 0;
    left: calc(100% + 0.4rem);
    max-width: 8rem;
    translate: none;
  }
  .slot.s0 {
    --seat-cw: clamp(3rem, 8cqw, 5rem);
    --plate-w: 8.5rem;
    --plate-name: 0.95rem;
    --plate-stack: 1.15rem;
  }
  /* A seat's bet sits beside its name plate, on the side facing the middle, so it always stays with the seat. */
  .bet {
    position: absolute;
    bottom: 0.2rem;
    left: calc(100% + 0.4rem);
    display: flex;
    align-items: flex-end;
    gap: 0.3rem;
    font-size: 0.9rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .s4 .bet,
  .s5 .bet {
    right: calc(100% + 0.4rem);
    left: auto;
    flex-direction: row-reverse;
  }
  /* The lower side seats' bets go under their plates, clear of the board and of your own cards. */
  .s1 .bet,
  .s5 .bet {
    top: calc(100% + 0.3rem);
    bottom: auto;
    left: 50%;
    right: auto;
    translate: -50% 0;
    flex-direction: row;
  }
  .bet span {
    padding: 0 0.4rem;
    border-radius: 1rem;
    background: rgb(0 0 0 / 0.45);
  }
  .s0 { --x: 50%; --y: 81%; }
  .s1 { --x: 11%; --y: 68%; }
  .s2 { --x: 11%; --y: 30%; }
  .s3 { --x: 50%; --y: 16%; }
  .s4 { --x: 89%; --y: 30%; }
  .s5 { --x: 89%; --y: 68%; }

  /* Narrow tables (phones): taller, with the seats pulled in and everything smaller. */
  @container (max-width: 600px) {
    .felt {
      aspect-ratio: 5 / 7.4;
      min-height: 0;
      /* But no taller than the screen leaves room for, after the header and your turn's buttons, so
         Fold, Call and Raise are in view without scrolling. dvh is the height the browser's toolbars leave. */
      width: 100%; /* so a shorter table stays full width, rather than narrowing to keep its shape */
      max-height: max(calc(100dvh - 15.5rem), 26.5rem); /* not so short that the result banner has no room */
      --cw: clamp(2.4rem, 12cqw, 3.8rem);
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
      --seat-cw: clamp(2.6rem, 13cqw, 4rem);
      --plate-w: 7rem;
      --plate-name: 0.85rem;
      --plate-stack: 1rem;
    }
    /* Your seat keeps clear of the bottom edge when a short screen makes the table shorter. */
    .s0 { --x: 50%; --y: min(85%, calc(100% - 4.3rem)); }
    /* On a table made shorter by a short screen, these two move down (by as much as it lost, roughly), to
       stay clear of the board. At full height the first value is the larger, so they are where they were. */
    .s1 { --x: 17%; --y: max(72%, calc(43.3% + 9rem)); }
    .s2 { --x: 17%; --y: 31%; }
    .s3 { --x: 50%; --y: 14%; }
    .s4 { --x: 83%; --y: 31%; }
    .s5 { --x: 83%; --y: max(72%, calc(43.3% + 9rem)); }
    /* No room for bets beside the seats on a phone: each seat's plate says what it has bet instead. */
    /* The result banner names the winning hand, and there is no room for the others. */
    .slot :global(.hand-name) {
      display: none;
    }
    .bet,
    .pot :global(.stack) {
      display: none;
    }
    /* On a phone, in the top-left corner on two short lines, clear of the seat at the top. */
    .info {
      top: 0.6rem;
      bottom: auto;
      left: 0.75rem;
      display: grid;
      font-size: 0.62rem;
      line-height: 1.35;
    }
    .info .dot {
      display: none;
    }
    .middle {
      /* Down a little on a table made shorter by a short screen, so the result banner, which grows upwards,
         stays clear of the seat at the top. At full height the first value is the larger. */
      top: max(46%, calc(37.3% + 2.75rem));
    }
    .pot strong {
      padding: 0.1rem 0.5rem;
      font-size: 0.9rem;
    }
    .deck-spot {
      top: 0.6rem;
      right: 0.6rem;
      --cw: clamp(1.7rem, 8.5cqw, 2.6rem);
    }
  }

  /* The narrowest phones (360 pixels): the result banner wraps onto more lines there, so the table may not
     get quite as short, leaving it room below the seat at the top. */
  @container (max-width: 340px) {
    .felt {
      max-height: max(calc(100dvh - 15.5rem), 27.5rem);
    }
  }
</style>
