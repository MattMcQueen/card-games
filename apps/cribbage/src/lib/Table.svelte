<script lang="ts">
  import type { CardChoice } from '@card-games/card-kit/choice.svelte';
  import Fan from '@card-games/card-kit/Fan.svelte';
  import type { Origin } from '@card-games/card-kit/motion';
  import ResultBanner from '@card-games/card-kit/ResultBanner.svelte';
  import TableInfo from '@card-games/card-kit/TableInfo.svelte';
  import YourHand from '@card-games/card-kit/YourHand.svelte';
  import YourSeat from '@card-games/card-kit/YourSeat.svelte';
  import { BOT_SEAT, GAME_POINTS, HUMAN_SEAT, PLAYERS, cardKey, legalCards, type Card, type GameState } from '../engine';
  import Board from './Board.svelte';
  import { scoredText } from './labels';
  import Middle from './Middle.svelte';
  import Plate from './Plate.svelte';
  import Stock from './Stock.svelte';
  import { bannerFor } from './verdict';

  let {
    game,
    chosen,
    yourCardFrom,
    onpick,
  }: {
    game: GameState;
    /** The cards you have chosen for the crib. */
    chosen: CardChoice;
    /** Where the card you last played was in your hand. */
    yourCardFrom: Origin;
    onpick: (card: Card, from: HTMLElement) => void;
  } = $props();

  const yourTurn = $derived(game.phase === 'pegging' && game.toPlay === HUMAN_SEAT);
  const playable = $derived(new Set(legalCards(game, HUMAN_SEAT).map(cardKey)));
  const banner = $derived(bannerFor(game));
  const scored = $derived(game.phase === 'pegging' || game.phase === 'collecting' ? scoredText(game) : '');
  const them = $derived(game.players[BOT_SEAT]!);
</script>

<!-- The board along the top; on the felt, the computer player across from you, the deck and crib on the left, the
     play in the middle, and you along the bottom. -->
{#snippet corner()}To {GAME_POINTS}{/snippet}
{#snippet yourPlate()}<Plate player={game.players[HUMAN_SEAT]!} {game} />{/snippet}

<div class="rail">
  <Board {game} />
  <div class="felt">
    <TableInfo info={[`Hand ${game.hand}`, game.dealer === HUMAN_SEAT ? 'You deal' : `${them.name} deals`]} {corner} />

    <div class="top">
      <Fan seat={BOT_SEAT} count={them.hand.length} hand={game.hand} dealer={game.dealer} seats={PLAYERS} />
      <Plate player={them} {game} />
    </div>

    <div class="stock-spot"><Stock {game} /></div>

    <div class="middle">
      {#if !banner}<Middle {game} {yourCardFrom} />{/if}
    </div>

    <div class="callout-spot">
      {#if banner}
        <ResultBanner {...banner} />
      {:else if scored}
        {#key game.scored}<p class="callout">{scored}</p>{/key}
      {/if}
    </div>

    <YourSeat plate={yourPlate} beside>
      <div id="your-hand">
        <YourHand
          cards={game.players[HUMAN_SEAT]!.hand}
          hand={game.hand}
          dealer={game.dealer}
          seats={PLAYERS}
          mode={game.phase === 'discarding' ? 'pass' : yourTurn ? 'play' : 'wait'}
          {playable}
          selected={chosen.keys}
          {onpick}
        />
      </div>
    </YourSeat>
  </div>
</div>

<style>
  .rail {
    container-type: inline-size;
    width: 100%;
    /* Never taller than the screen leaves room for, so the buttons below stay in view: the felt is 10/16 of its
       width tall, and the board above it about a tenth. At least wide enough for the wide layout, past 600px. */
    max-width: max(40rem, calc((100dvh - 17rem) / (10 / 16 + 0.1)));
    margin-inline: auto;
  }
  /* The felt itself is the kit's (app.css). */
  .felt {
    aspect-ratio: 16 / 10;
    /* Sizes for the cards on the felt, scaled to the table's width. */
    --cw: clamp(2.6rem, 7cqw, 4.6rem);
    --ch: calc(var(--cw) * 1.455);
    --plate-w: 6.8rem;
  }
  /* Ruth: a tight fan of her cards above her name plate. */
  .top {
    position: absolute;
    display: grid;
    justify-items: center;
    gap: 0.3rem;
    left: 50%;
    top: 3%;
    translate: -50% 0;
    --cw: clamp(1.9rem, 4.6cqw, 3.1rem);
    --ch: calc(var(--cw) * 1.455);
  }
  /* The deck and crib in the top-left corner, under the hand and dealer. */
  .stock-spot {
    position: absolute;
    left: 1rem;
    top: 2.6rem;
  }
  .middle {
    position: absolute;
    left: 50%;
    top: 47%;
    translate: -50% -50%;
  }
  /* What was just pegged, or the result of the game, under the middle. */
  .callout-spot {
    position: absolute;
    left: 50%;
    top: 47%;
    translate: -50% -50%;
    width: min(60cqw, 30rem);
    display: grid;
    place-items: center;
    pointer-events: none;
    z-index: 3;
  }
  .callout-spot:has(.callout) {
    top: 68%;
  }
  .callout {
    margin: 0;
    padding: 0.2rem 0.9rem;
    border-radius: 1rem;
    background: var(--win-bg);
    color: var(--win-fg);
    font-weight: 700;
    font-size: 0.9rem;
    text-align: center;
    animation: pop 0.35s cubic-bezier(0.2, 1.4, 0.4, 1) both;
  }
  @keyframes pop {
    from {
      transform: scale(0.6);
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .callout {
      animation: none;
    }
  }

  /* Six cards to choose from, larger than a hand of thirteen. */
  #your-hand {
    max-width: 30rem;
    width: 100%;
    justify-self: center;
  }

  /* Narrow tables (phones): taller, with everything stacked and smaller. */
  @container (max-width: 600px) {
    .felt {
      aspect-ratio: 5 / 7;
      width: 100%;
      /* No taller than the screen leaves room for, after the header, the board, and the line and button below. */
      max-height: max(calc(100dvh - 19.5rem), 22rem);
      --cw: clamp(2.4rem, 12cqw, 3.4rem);
      --plate-w: 5.4rem;
      --plate-name: 0.74rem;
      --plate-stack: 0.9rem;
      --plate-status: 0.66rem;
    }
    .top {
      top: 0.6rem;
      --cw: clamp(1.6rem, 8cqw, 2.4rem);
    }
    /* The deck and crib on the left, beside the play, which is a little right of the middle to make room. */
    .stock-spot {
      left: 0.5rem;
      top: 46%;
      translate: 0 -50%;
    }
    .middle {
      left: calc(50% + 2rem);
      top: 46%;
    }
    .callout-spot {
      top: 46%;
      width: 80cqw;
    }
    .callout-spot:has(.callout) {
      top: 65%;
    }
    .callout {
      font-size: 0.75rem;
    }
  }
</style>
