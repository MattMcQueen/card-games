<script lang="ts">
  import { reducedMotion } from '@card-games/card-kit/motion';
  import { BOT_SEAT, HUMAN_SEAT, type GameState } from '../engine';
  import { BOARD_HEIGHT, BOARD_WIDTH, endHoles, holeAt, holesOf, skunkLine } from './board';

  /** The pegging board along the top of the table: each player's front peg at their score, the back peg where it was. */
  let { game }: { game: GameState } = $props();

  const seats = [BOT_SEAT, HUMAN_SEAT];
  const label = $derived(seats.map((s) => `${game.players[s]!.human ? 'you' : game.players[s]!.name} ${game.players[s]!.score}`).join(', '));
</script>

<svg
  class="board"
  viewBox="0 0 {BOARD_WIDTH} {BOARD_HEIGHT}"
  role="img"
  aria-label="Pegging board: {label}"
  style:--peg-move={reducedMotion ? '0s' : '0.6s'}
>
  <rect class="wood" x="0.5" y="0.5" width={BOARD_WIDTH - 1} height={BOARD_HEIGHT - 1} rx="4" />
  <line class="split" x1="3" x2={BOARD_WIDTH - 3} y1={BOARD_HEIGHT / 2} y2={BOARD_HEIGHT / 2} />
  {#each seats as seat (seat)}
    {#each holesOf(seat) as hole, i (i)}
      <circle class="hole" cx={hole.x} cy={hole.y} r="1.05" />
    {/each}
    {@const skunk = skunkLine(seat)}
    <line class="skunk" x1={skunk.x} x2={skunk.x} y1={skunk.y - 3} y2={skunk.y + 3} />
  {/each}
  {#each endHoles as hole, i (i)}
    <circle class="hole end" cx={hole.x} cy={hole.y} r="1.5" />
  {/each}
  {#each seats as seat (seat)}
    {@const player = game.players[seat]!}
    {#each [player.previous, player.score] as score, front (front)}
      {@const at = holeAt(seat, score)}
      <circle class="peg" class:yours={seat === HUMAN_SEAT} class:back={front === 0} r="2.2" style:transform="translate({at.x}px, {at.y}px)" />
    {/each}
  {/each}
</svg>

<style>
  .board {
    display: block;
    width: 100%;
    height: auto;
    margin-bottom: clamp(0.4rem, 1.4vw, 0.7rem);
  }
  .wood {
    fill: #8a5a2b;
    stroke: #2b1808;
    stroke-width: 0.6;
  }
  .split {
    stroke: rgb(0 0 0 / 0.3);
    stroke-width: 0.5;
  }
  .hole {
    fill: #2b1808;
  }
  .skunk {
    stroke: #f4e0a0;
    stroke-width: 0.6;
    opacity: 0.7;
  }
  .peg {
    fill: #9fd3ff;
    stroke: rgb(0 0 0 / 0.55);
    stroke-width: 0.5;
    transition: transform var(--peg-move) cubic-bezier(0.33, 1, 0.68, 1);
  }
  .peg.yours {
    fill: var(--highlight);
  }
  .peg.back {
    opacity: 0.55;
  }
</style>
