<script lang="ts">
  import type { GameState } from '../engine';
  import BetSpot from './BetSpot.svelte';
  import Chip from './Chip.svelte';
  import HandView from './HandView.svelte';
  import Shoe from './Shoe.svelte';
  import TableMarkings from './TableMarkings.svelte';
  import Verdict from './Verdict.svelte';

  let {
    game,
    bet,
    shownChips,
    settling,
    showResults,
  }: {
    game: GameState;
    /** The bet being built on the betting screen. */
    bet: number;
    /** Chips held, not counting winnings still to be revealed. */
    shownChips: number;
    /** The dealer is still playing: the totals and the result wait. */
    settling: boolean;
    showResults: boolean;
  } = $props();

  const inRound = $derived(game.phase !== 'betting');
</script>

<!-- The table: a walnut rail around green felt. -->
<div class="rail">
  <div class="felt">
    <TableMarkings faded={inRound} />
    <p class="balance" aria-label="Chips: {shownChips}">
      <span class="balance-chip"><Chip value={5} /></span>
      <strong>{shownChips}</strong>
    </p>
    <div class="shoe-corner"><Shoe /></div>

    <div class="zone dealer-zone">
      {#if inRound}
        <HandView title="Dealer" role="dealer" cards={game.dealer} hideTotal={settling} />
      {/if}
    </div>

    <Verdict {game} {showResults} />

    <div class="zone player-zone">
      {#if inRound}
        <div class="hands">
          {#each game.hands as hand, i (i)}
            <HandView
              title={game.hands.length > 1 ? `Hand ${i + 1}` : 'You'}
              role="player"
              cards={hand.cards}
              bet={hand.bet}
              active={game.phase === 'player' && i === game.active}
              result={showResults ? game.results[i] : undefined}
              showPill={game.hands.length > 1}
            />
          {/each}
        </div>
      {:else}
        <BetSpot {bet} />
      {/if}
    </div>
  </div>
</div>

<style>
  .rail {
    padding: clamp(0.5rem, 1.6vw, 0.9rem);
    border-radius: clamp(1.2rem, 4vw, 2.4rem);
    background: linear-gradient(160deg, var(--wood-1), var(--wood-2) 55%, var(--wood-3));
    box-shadow:
      0 10px 30px rgb(0 0 0 / 0.45),
      inset 0 1px 1px rgb(255 255 255 / 0.25);
  }
  .felt {
    position: relative;
    display: grid;
    grid-template-rows: auto auto 1fr;
    gap: 0.25rem;
    min-height: clamp(27rem, 62vh, 36rem);
    padding: 1rem 0.5rem 1rem;
    border-radius: clamp(0.8rem, 3vw, 1.7rem);
    overflow: hidden;
    color: var(--on-felt);
    background:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .14 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"),
      radial-gradient(ellipse at 50% 40%, var(--felt-1) 0%, var(--felt-2) 55%, var(--felt-3) 100%);
    box-shadow: inset 0 0 40px rgb(0 0 0 / 0.55);
  }
  .balance {
    position: absolute;
    top: 0.8rem;
    left: 0.8rem;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin: 0;
    padding: 0.2rem clamp(0.6rem, 3vw, 0.9rem) 0.2rem 0.3rem;
    border: 1px solid color-mix(in srgb, var(--gold) 35%, transparent);
    border-radius: 2rem;
    background: rgb(0 0 0 / 0.35);
    font-size: clamp(1rem, 4.5vw, 1.15rem);
    font-variant-numeric: tabular-nums;
  }
  .balance-chip {
    width: 1.9rem;
    height: 1.9rem;
  }
  /* On a phone the dealer's label (which can read "SOFT 11") reaches toward the corner, so the
     chip count sheds its icon to stay out of the way. */
  @media (max-width: 480px) {
    .balance {
      padding: 0.2rem 0.7rem;
      font-size: 1rem;
    }
    .balance-chip {
      display: none;
    }
  }
  .shoe-corner {
    position: absolute;
    top: 0.8rem;
    right: 1rem;
  }
  .zone {
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }
  .dealer-zone {
    min-height: calc(var(--ch) + 2.6rem);
  }
  .player-zone {
    align-self: end;
  }
  .hands {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem 0.5rem;
  }
</style>
