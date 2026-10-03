<script lang="ts">
  import type { Origin } from '@card-games/card-kit/motion';
  import { HUMAN_SEAT, cardKey, legalCards, passSource, type Card, type GameState } from '../engine';
  import Fan from './Fan.svelte';
  import { directionLabel } from './labels';
  import Plate from './Plate.svelte';
  import Trick from './Trick.svelte';
  import Verdict from './Verdict.svelte';
  import YourHand from './YourHand.svelte';

  let {
    game,
    selected,
    yourCardFrom,
    onpick,
  }: {
    game: GameState;
    /** The cards chosen to pass (as "QS"). */
    selected: ReadonlySet<string>;
    /** Where the card you last played was in your hand. */
    yourCardFrom: Origin;
    onpick: (card: Card, from: HTMLElement) => void;
  } = $props();

  const you = $derived(game.players[HUMAN_SEAT]!);
  const others = $derived(game.players.filter((p) => !p.human));
  const yourTurn = $derived(game.phase === 'playing' && game.toPlay === HUMAN_SEAT);
  const mode = $derived(game.phase === 'passing' ? 'pass' : yourTurn ? 'play' : 'wait');
  const playable = $derived(new Set(legalCards(game, HUMAN_SEAT).map(cardKey)));
  // The cards passed to you stand out until the first trick has been played.
  const received = $derived(new Set(game.tricksPlayed === 0 ? you.received.map(cardKey) : []));
</script>

<!-- The table: you along the bottom, and the computer players on your left, across and on your right. -->
<div class="rail">
  <div class="felt">
    <p class="info"><span>Hand {game.hand}</span><span class="dot"> · </span><span>{directionLabel(game)}</span></p>
    <!-- Where the deal flies out from: the middle of the table. -->
    <div id="deck" class="deck-spot" aria-hidden="true"></div>

    {#each others as player (player.id)}
      <div class="slot s{player.id}">
        <Fan seat={player.id} count={player.hand.length} hand={game.hand} />
        <Plate {player} {game} />
      </div>
    {/each}

    <div class="middle">
      <Trick {game} {yourCardFrom} />
      <div class="verdict-spot"><Verdict {game} /></div>
    </div>

    <div class="bottom">
      <div class="slot s0"><Plate player={you} {game} /></div>
      <YourHand
        cards={you.hand}
        hand={game.hand}
        {mode}
        {playable}
        {selected}
        {received}
        receivedFrom={passSource(HUMAN_SEAT, game.direction)}
        {onpick}
      />
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
  .info {
    position: absolute;
    top: 0.8rem;
    left: 1rem;
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--gold) 55%, transparent);
  }
  .deck-spot {
    position: absolute;
    left: 50%;
    top: 42%;
  }

  /* The computer players: a tight fan of their cards above their name plates. */
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
    /* In the top-left corner on two short lines, clear of the player at the top. */
    .info {
      top: 0.6rem;
      left: 0.75rem;
      display: grid;
      font-size: 0.62rem;
      line-height: 1.35;
    }
    .info .dot {
      display: none;
    }
  }
</style>
