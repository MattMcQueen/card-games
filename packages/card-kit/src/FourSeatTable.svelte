<script lang="ts">
  import type { Play, Seat } from '@card-games/cards-core';
  import type { Snippet } from 'svelte';
  import type { Banner } from './banner';
  import Fan from './Fan.svelte';
  import type { Origin } from './motion';
  import ResultBanner from './ResultBanner.svelte';
  import Trick from './Trick.svelte';

  /**
   * The table of a trick-taking game for four (Hearts, Spades, Bridge): you along the bottom, and the computer players
   * on your left (seat 1), across (seat 2) and on your right (seat 3), each with their cards face down, and the
   * trick in the middle. The game fills in the rest: `info` in the top-left corner (on one line on a wide table,
   * and a line each on a narrow one), an optional `corner` top right, each seat's name `plate`, the result of
   * the hand (`banner`) over the trick once it is over, and `yourHand`. In Bridge one computer player's hand
   * may be `open` (face up, the dummy): the game draws it with `openHand` in place of their face-down cards.
   */
  let {
    game,
    dealer,
    yourCardFrom,
    info,
    corner,
    plate,
    banner,
    yourHand,
    open = -1,
    openHand,
  }: {
    /** The hand being played: its number, the players, and the trick (the `tricksPlayed`-th, taken by `winner`). */
    game: {
      readonly hand: number;
      readonly players: readonly Seat[];
      readonly trick: readonly Play[];
      readonly tricksPlayed: number;
      readonly winner: number;
    };
    /** Who dealt the hand: the deal starts on their left. */
    dealer: number;
    /** Where the card you last played was in your hand (or the open hand): it flies to the trick from there. */
    yourCardFrom: Origin;
    info: readonly string[];
    corner?: Snippet;
    plate: Snippet<[number]>;
    banner: Banner | null;
    yourHand: Snippet;
    /** The seat (1 to 3) whose cards are face up, or -1. */
    open?: number;
    openHand?: Snippet<[number]>;
  } = $props();
</script>

<div class="rail">
  <div class="felt">
    <p class="info">
      {#each info as part, i (i)}{#if i > 0}<span class="dot">{' · '}</span>{/if}<span>{part}</span>{/each}
    </p>
    {#if corner}<div class="corner">{@render corner()}</div>{/if}
    <!-- Where the deal flies out from: the middle of the table. -->
    <div id="deck" class="deck-spot" aria-hidden="true"></div>

    {#each [1, 2, 3] as id (id)}
      <div class="slot s{id}">
        {#if id === open && openHand}
          {@render openHand(id)}
        {:else}
          <Fan seat={id} count={game.players[id]?.hand.length ?? 0} hand={game.hand} {dealer} />
        {/if}
        {@render plate(id)}
      </div>
    {/each}

    <div class="middle">
      <Trick trick={game.trick} round="{game.hand}-{game.tricksPlayed}" winner={game.winner} {yourCardFrom} {open} />
      <div class="verdict-spot">
        {#if banner}<ResultBanner {...banner} />{/if}
      </div>
    </div>

    <div class="bottom">
      <div class="slot s0">{@render plate(0)}</div>
      {@render yourHand()}
    </div>
  </div>
</div>

<style>
  .rail {
    container-type: inline-size;
    /* Never taller than the screen leaves room for, so the buttons below stay in view. */
    width: 100%;
    max-width: max(36rem, calc((100dvh - 15rem) * 16 / 11));
    margin-inline: auto;
  }
  /* The felt itself is the kit's (app.css). */
  .felt {
    aspect-ratio: 16 / 11;

    /* Sizes for the cards on the felt, scaled to the table's width: the trick's here, the others' below. */
    --cw: clamp(2.6rem, 7cqw, 4.6rem);
    --ch: calc(var(--cw) * 1.455);
    --plate-w: 6.8rem;
  }
  .info,
  .corner {
    position: absolute;
    top: 0.8rem;
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--gold) 55%, transparent);
  }
  .info {
    left: 1rem;
  }
  .corner {
    right: 1rem;
    text-align: right;
  }
  .deck-spot {
    position: absolute;
    left: 50%;
    top: 42%;
  }

  /* The computer players: a tight fan of their cards above their name plates (the game's Fan and plate). */
  .slot {
    display: grid;
    justify-items: center;
    gap: 0.3rem;
  }
  .felt > .slot {
    position: absolute;
    --cw: clamp(1.9rem, 4.6cqw, 3.1rem);
    --ch: calc(var(--cw) * 1.455);
  }
  .s1 {
    left: 2.5%;
    top: 42%;
    translate: 0 -50%;
  }
  .s2 {
    left: 50%;
    top: 3%;
    translate: -50% 0;
  }
  .s3 {
    right: 2.5%;
    top: 42%;
    translate: 0 -50%;
  }

  .middle {
    position: absolute;
    left: 50%;
    top: 42%;
    translate: -50% -50%;
  }
  /* The result of a hand, over the middle of the table (the trick has been taken by then). */
  .verdict-spot {
    position: absolute;
    left: 50%;
    top: 50%;
    translate: -50% -50%;
    width: min(60cqw, 30rem);
    display: grid;
    place-items: center;
    z-index: 3;
    pointer-events: none;
  }

  /* You: your name plate to the left of your cards, which take the width between it and its twin space on the right. */
  .bottom {
    position: absolute;
    left: 1rem;
    right: 1rem;
    bottom: 0.9rem;
    display: grid;
    grid-template-columns: var(--plate-w) minmax(0, 1fr) var(--plate-w);
    align-items: end;
    gap: 1rem;
  }
  .s0 {
    --plate-w: 7.5rem;
    --plate-name: 0.95rem;
    --plate-stack: 1.15rem;
  }

  /* Narrow tables (phones): taller, with the players pulled in and everything smaller. */
  @container (max-width: 600px) {
    .felt {
      aspect-ratio: 5 / 7.4;
      width: 100%;
      /* No taller than the screen leaves room for, after the header and the line and button below the table. */
      max-height: max(calc(100dvh - 15.5rem), 26rem);
      --cw: clamp(2.4rem, 12.5cqw, 3.6rem);
      --plate-w: 5.4rem;
      --plate-name: 0.74rem;
      --plate-stack: 0.9rem;
      --plate-status: 0.66rem;
    }
    .felt > .slot {
      --cw: clamp(1.6rem, 8cqw, 2.4rem);
      --fan-step: 0.09;
    }
    .s1,
    .s3 {
      top: 30%;
    }
    /* A little below the middle, clear of the players at the sides. */
    .verdict-spot {
      top: 66%;
      width: 64cqw;
    }
    .s1 {
      left: 0.5rem;
    }
    .s3 {
      right: 0.5rem;
    }
    .s2 {
      top: 0.6rem;
    }
    .middle,
    .deck-spot {
      top: 46%;
    }
    .bottom {
      left: 0.5rem;
      right: 0.5rem;
      bottom: 0.6rem;
      grid-template-columns: minmax(0, 1fr);
      gap: 0.2rem;
    }
    .s0 {
      justify-self: start;
      --plate-w: 6rem;
      --plate-name: 0.8rem;
      --plate-stack: 0.95rem;
    }
    /* In the top corners on two short lines, clear of the player at the top. */
    .info,
    .corner {
      top: 0.6rem;
      font-size: 0.62rem;
      line-height: 1.35;
    }
    .info {
      left: 0.75rem;
      display: grid;
    }
    .corner {
      right: 0.75rem;
    }
    .info .dot {
      display: none;
    }
  }
</style>
