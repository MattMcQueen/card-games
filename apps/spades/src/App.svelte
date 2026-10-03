<script lang="ts">
  import { preloadCards } from '@card-games/card-kit/cardImages';
  import Site from '@card-games/card-kit/Site.svelte';
  import { animationTime, fromRect } from '@card-games/card-kit/trickMotion';
  import { TurnTaker } from '@card-games/card-kit/turns.svelte';
  import { HUMAN_SEAT, chooseBid, collect, decide, isBotTurn, newGame, nextHand, placeBid, playCard, type Card } from './engine';
  import About from './lib/About.svelte';
  import Controls from './lib/Controls.svelte';
  import { cuesFor, playCues } from './lib/cues';
  import HowToPlay from './lib/HowToPlay.svelte';
  import { announcementFor } from './lib/labels';
  import Table from './lib/Table.svelte';

  // The computer players bid and play a little apart, and each complete trick waits a moment to be taken.
  const table = new TurnTaker(newGame(), {
    sounds: (prev, next) => playCues(cuesFor(prev, next)),
    moving: (prev, next) => animationTime(prev, next),
    isBotTurn,
    botMove: (game) => (game.phase === 'bidding' ? placeBid(game, chooseBid(game)) : playCard(game, decide(game))),
    collect,
  });
  const game = $derived(table.game);

  /** Where the card you last played was, so it flies to the trick from there. */
  let yourCardFrom = $state.raw(fromRect(null));

  function pick(card: Card, from: HTMLElement) {
    yourCardFrom = fromRect(from.getBoundingClientRect());
    table.update(playCard(game, card));
  }

  const yourTurn = $derived(game.phase === 'playing' && game.toPlay === HUMAN_SEAT);
  const announcement = $derived(announcementFor(game, yourTurn));
</script>

<svelte:window onpointerdown={preloadCards} />
<Site name="Spades" {HowToPlay} {About}>
  <div class="sr-only" role="status" aria-live="polite">{announcement}</div>

  <Table {game} {yourCardFrom} onpick={pick} />
  <Controls
    {game}
    onbid={(tricks) => table.update(placeBid(game, tricks))}
    onnext={() => table.update(nextHand(game))}
    onrestart={() => table.update(newGame())}
  />
</Site>
