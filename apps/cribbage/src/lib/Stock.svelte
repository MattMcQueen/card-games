<script lang="ts">
  import CardBack from '@card-games/card-kit/CardBack.svelte';
  import CardPile from '@card-games/card-kit/CardPile.svelte';
  import { dealt } from '@card-games/card-kit/motion';
  import PlayingCard from '@card-games/card-kit/PlayingCard.svelte';
  import { fromElement } from '@card-games/card-kit/trickMotion';
  import { DISCARDS, HUMAN_SEAT, type GameState } from '../engine';

  /** The deck, with the starter turned up on it once it is cut, and the dealer's crib beside it, face down. */
  let { game }: { game: GameState } = $props();

  /** The crib is face down here until it is counted, last of all. */
  const cribHidden = $derived(!game.shows.some((s) => s.crib));
  const owner = $derived(game.dealer === HUMAN_SEAT ? 'Your crib' : `${game.players[game.dealer]!.name}'s crib`);
</script>

<div class="stock">
  <figure>
    <div class="spot">
      <CardPile id="deck" />
      {#if game.starter}
        {#key game.hand}
          <div class="starter"><PlayingCard card={game.starter} still /></div>
        {/key}
      {/if}
    </div>
    <figcaption>Starter</figcaption>
  </figure>
  <figure>
    <!-- Always here, so the crib's cards can fly out of it to be counted. -->
    <div class="spot crib" id="crib" role="img" aria-label="{owner}: {cribHidden ? game.crib.length : 0} cards">
      {#if cribHidden}
        {#each game.crib as _, i (`${game.hand}-${i}`)}
          <div class="back" style:--i={i} use:dealt={{ from: fromElement(i < DISCARDS ? 'your-hand' : 'fan-1') }}><CardBack /></div>
        {/each}
      {/if}
    </div>
    <figcaption><span class="whose">{owner.replace(/crib$/, '')}</span>crib</figcaption>
  </figure>
</div>

<style>
  .stock {
    display: flex;
    gap: calc(var(--cw) * 0.3);
  }
  figure {
    display: grid;
    justify-items: center;
    gap: 0.25rem;
    margin: 0;
  }
  .spot {
    position: relative;
    width: var(--cw);
    height: calc(var(--ch) + 9px);
  }
  .starter {
    position: absolute;
    left: 2px;
    top: 0;
    width: var(--cw);
    height: var(--ch);
  }
  .crib {
    border-radius: 8% / 5.7%;
    outline: 1px dashed color-mix(in srgb, var(--gold) 35%, transparent);
    outline-offset: -1px;
  }
  .back {
    position: absolute;
    top: calc(var(--i) * 3px);
    left: calc(var(--i) * -1px);
    width: var(--cw);
    height: var(--ch);
    border-radius: 8% / 5.7%;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.5);
  }
  /* On a narrow table (a phone) just "Crib": the dealer's plate says whose it is. */
  @container (max-width: 600px) {
    .whose {
      display: none;
    }
  }
  figcaption {
    font-size: 0.66rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    white-space: nowrap;
    color: color-mix(in srgb, var(--gold) 70%, transparent);
  }
</style>
