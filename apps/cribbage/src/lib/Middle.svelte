<script lang="ts">
  import { reducedMotion, type Origin } from '@card-games/card-kit/motion';
  import PlayingCard from '@card-games/card-kit/PlayingCard.svelte';
  import { fromElement } from '@card-games/card-kit/trickMotion';
  import { fade } from 'svelte/transition';
  import { HUMAN_SEAT, cardKey, currentShow, type GameState } from '../engine';
  import { showTitle } from './labels';

  /**
   * The middle of the table: in the play, the cards laid since the count was last 0 with the count over them; in the
   * show, the hand being counted with its points.
   */
  let { game, yourCardFrom }: { game: GameState; yourCardFrom: Origin } = $props();

  const show = $derived(game.phase === 'showing' || game.phase === 'settled' ? currentShow(game) : undefined);
  const playing = $derived(game.phase === 'pegging' || game.phase === 'collecting');
  /** Where a counted hand comes from: your hand, the computer player's, or the crib. */
  const showFrom = $derived(!show ? undefined : show.crib ? fromElement('crib') : show.seat === HUMAN_SEAT ? fromElement('your-hand') : fromElement('fan-1'));
</script>

<div class="middle-area">
  {#if playing}
    <p class="badge" aria-live="off">Count <strong>{game.count}</strong></p>
    <div class="row" style:--n={8} role="group" aria-label="The cards played">
      {#each game.pile as { seat, card }, i (`${game.hand}-${cardKey(card)}`)}
        <div class="spot" class:theirs={seat !== HUMAN_SEAT} style:--i={i} out:fade={{ duration: reducedMotion ? 0 : 300 }}>
          <PlayingCard {card} from={seat === HUMAN_SEAT ? yourCardFrom : fromElement('fan-1')} faceUp={seat === HUMAN_SEAT} />
        </div>
      {/each}
    </div>
  {:else if show}
    <p class="badge">{showTitle(game, show)} <strong>{show.count.total}</strong></p>
    <div class="row shown" style:--n={show.cards.length} role="group" aria-label={showTitle(game, show)}>
      {#each show.cards as card, i (`${game.hand}-show-${game.shows.length}-${cardKey(card)}`)}
        <div class="spot" style:--i={i}>
          <PlayingCard {card} delay={i * 60} from={showFrom} faceUp={!show.crib && show.seat === HUMAN_SEAT} />
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .middle-area {
    display: grid;
    justify-items: center;
    gap: 0.35rem;
  }
  .badge {
    margin: 0;
    padding: 0.1rem 0.7rem;
    border-radius: 1rem;
    background: rgb(12 22 18 / 0.7);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--gold);
    white-space: nowrap;
  }
  .badge strong {
    margin-left: 0.25rem;
    font-size: 1rem;
    color: var(--on-felt);
    font-variant-numeric: tabular-nums;
  }
  /* Room for --n cards overlapping: eight in the play, the most one count can hold. The computer player's sit a
     little higher. A hand being counted is spread out, so every card can be read. */
  .row {
    --step: 0.42;
    position: relative;
    width: calc(var(--cw) * (1 + (var(--n) - 1) * var(--step)));
    height: calc(var(--ch) * 1.12);
  }
  .spot {
    position: absolute;
    left: calc(var(--i) * var(--cw) * var(--step));
    top: calc(var(--ch) * 0.12);
    width: var(--cw);
    height: var(--ch);
  }
  .shown {
    --step: 1.08;
  }
  .spot.theirs {
    top: 0;
  }
</style>
