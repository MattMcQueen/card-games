<script lang="ts">
  import PlayingCard from '@card-games/card-kit/PlayingCard.svelte';
  import { cardName } from '@card-games/cards-core';
  import { cardKey, type Card, type Suit } from '../engine';

  /**
   * The dummy: a computer player's cards laid face up once the opening lead is made. Across the table (your
   * partner's) they are one row, which you play from when you declare; on your left or right, a row for each
   * suit, trumps first. Its id is the seat's, as a face-down hand's is, so its cards fly to the trick from here.
   */
  let {
    seat,
    name,
    cards,
    trumps,
    playable,
    onpick,
  }: {
    seat: number;
    name: string;
    cards: readonly Card[];
    trumps: Suit | null;
    /** The cards you may play from it now (as "QS"): only when you are the declarer and it is the dummy's turn. */
    playable: ReadonlySet<string>;
    onpick: (card: Card, from: HTMLElement) => void;
  } = $props();

  const ORDER: readonly Suit[] = ['S', 'H', 'C', 'D'];
  const suits = $derived([...ORDER].sort((a, b) => Number(b === trumps) - Number(a === trumps)));
  const rows = $derived(seat === 2 ? [cards] : suits.map((s) => cards.filter((c) => c.suit === s)).filter((r) => r.length > 0));
</script>

<div class="dummy" class:across={seat === 2} id="fan-{seat}" role="group" aria-label="{name}’s cards (the dummy)">
  {#each rows as row, r (r)}
    <div class="row" style:--n={row.length}>
      {#each row as card (cardKey(card))}
        {@const key = cardKey(card)}
        <button
          type="button"
          class="slot card-button"
          class:usable={playable.has(key)}
          disabled={!playable.has(key)}
          aria-label={cardName(card)}
          data-card={key}
          onclick={(event) => onpick(card, event.currentTarget)}
        >
          <PlayingCard {card} still dim={playable.size > 0 && !playable.has(key)} />
        </button>
      {/each}
    </div>
  {/each}
</div>

<style>
  /* On your left or right: rows by suit, each overlapping the one above so every card's corner shows. */
  .dummy {
    --cw: clamp(2rem, 5.6cqw, 3.6rem);
    --ch: calc(var(--cw) * 1.455);
    --max-w: 27cqw;
    display: grid;
    justify-items: start;
  }
  .row {
    --step: min(calc(var(--cw) * 0.4), calc((var(--max-w) - var(--cw)) / max(var(--n) - 1, 1)));
    display: flex;
  }
  .row + .row {
    margin-top: calc(var(--ch) * -0.62);
  }
  /* Across the table: one row, as tall as a face-down hand there, so your partner's plate keeps its place. */
  .across {
    --cw: clamp(1.9rem, 4.6cqw, 3.1rem);
    --max-w: 62cqw;
    justify-items: center;
  }
  .across .row {
    --step: min(calc(var(--cw) * 0.5), calc((var(--max-w) - var(--cw)) / max(var(--n) - 1, 1)));
  }
  /* Card buttons (app.css), overlapping. */
  .slot + .slot {
    margin-left: calc(var(--step) - var(--cw));
  }
  /* A card you can play from the dummy lights up under the pointer. It does not move, as a card that moved
     out from under the pointer would flicker. */
  @media (hover: hover) {
    .usable:hover {
      z-index: 1;
      box-shadow: 0 0 0 3px var(--highlight);
    }
  }

  @container (max-width: 600px) {
    .dummy {
      --cw: clamp(1.6rem, 8.5cqw, 2.3rem);
      --max-w: 30cqw;
    }
    /* Between the corners' lines, which take the top corners of a narrow table. */
    .across {
      --cw: clamp(1.7rem, 9cqw, 2.4rem);
      --max-w: 54cqw;
    }
  }
</style>
