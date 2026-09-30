<script lang="ts">
  import { HUMAN_SEAT, type GameState } from '../engine';

  let { game, revealed }: { game: GameState; revealed: boolean } = $props();

  // Who took the pots: "You win 240", "Terry wins 120", or one clause each when several seats won.
  const banner = $derived.by(() => {
    if (!revealed) return null;
    const wins = game.log.filter((e) => e.kind === 'win');
    if (wins.length === 0) return null;
    const main = wins
      .map((w) => `${game.seats[w.seat]?.name} ${w.seat === HUMAN_SEAT ? 'win' : 'wins'} ${w.amount}`)
      .join(' · ');
    return {
      tone: wins.some((w) => w.seat === HUMAN_SEAT) ? 'win' : 'lose',
      main,
      sub: game.showdown ? (game.results[wins[0]?.seat ?? 0]?.rank?.name ?? '') : 'Everyone else folded',
    };
  });
</script>

<div class="verdict-slot">
  {#if banner}
    <div class="verdict {banner.tone}" role="status">
      <strong>{banner.main}</strong>
      {#if banner.sub}<span>{banner.sub}</span>{/if}
    </div>
  {/if}
</div>

<style>
  /* Takes the place of the pot, above the board (the pot is swept away once the result shows), without taking any room of its own. */
  .verdict-slot {
    position: absolute;
    top: 0;
    left: 50%;
    z-index: 3;
    translate: -50% 0;
    width: max-content;
    max-width: 90cqw;
  }
  .verdict {
    display: grid;
    justify-items: center;
    padding: 0.3rem 1.2rem;
    border-radius: 1rem;
    text-align: center;
    animation: pop 0.4s cubic-bezier(0.2, 1.4, 0.4, 1) both;
  }
  .verdict strong {
    font: 400 clamp(1.1rem, 4.4cqw, 1.6rem) / 1.2 var(--serif);
  }
  .verdict span {
    font-size: 0.8rem;
    font-weight: 600;
  }
  .win {
    background: var(--win-bg);
    color: var(--win-fg);
  }
  .lose {
    background: var(--lose-bg);
    color: var(--lose-fg);
  }
  @keyframes pop {
    from {
      transform: scale(0.6);
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .verdict {
      animation: none;
    }
  }
</style>
