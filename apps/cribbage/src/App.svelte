<script lang="ts">
  import { preloadCards } from '@card-games/card-kit/cardImages';
  import Site from '@card-games/card-kit/Site.svelte';
  import { fromRect } from '@card-games/card-kit/trickMotion';
  import { CardChoice } from '@card-games/card-kit/choice.svelte';
  import { TurnTaker } from '@card-games/card-kit/turns.svelte';
  import {
    BOT_SEAT,
    DISCARDS,
    HUMAN_SEAT,
    chooseDiscard,
    collect,
    decide,
    discard,
    isBotTurn,
    mustGo,
    newGame,
    nextHand,
    playCard,
    sayGo,
    showNext,
    type Card,
  } from './engine';
  import About from './lib/About.svelte';
  import Controls from './lib/Controls.svelte';
  import { cuesFor, playCues } from './lib/cues';
  import HowToPlay from './lib/HowToPlay.svelte';
  import { announcementFor } from './lib/labels';
  import { movingTime } from './lib/motion';
  import Table from './lib/Table.svelte';

  // Ruth plays a little after you, so you can follow her, and a finished count stays on the table for a moment.
  const table = new TurnTaker(newGame(), {
    sounds: (prev, next) => playCues(cuesFor(prev, next)),
    moving: (prev, next) => movingTime(prev, next),
    isBotTurn,
    botMove: (game) => (mustGo(game) ? sayGo(game) : playCard(game, decide(game))),
    collect,
  });
  const game = $derived(table.game);

  /** The cards chosen for the crib. */
  const chosen = new CardChoice(DISCARDS);
  /** Where the card you last played was, so it flies to the pile from there. */
  let yourCardFrom = $state.raw(fromRect(null));

  function pick(card: Card, from: HTMLElement) {
    if (game.phase === 'discarding') {
      chosen.toggle(card);
      return;
    }
    yourCardFrom = fromRect(from.getBoundingClientRect());
    table.update(playCard(game, card));
  }

  function toCrib() {
    table.update(discard(game, [chosen.take(game.players[HUMAN_SEAT]!.hand), chooseDiscard(game, BOT_SEAT)]));
  }

  function restart() {
    chosen.clear();
    table.update(newGame());
  }

  const announcement = $derived(announcementFor(game));
</script>

<svelte:window onpointerdown={preloadCards} />
<Site name="Cribbage" {HowToPlay} {About}>
  <div class="sr-only" role="status" aria-live="polite">{announcement}</div>

  <Table {game} {chosen} {yourCardFrom} onpick={pick} />
  <Controls
    {game}
    chosen={chosen.keys.size}
    ondiscard={toCrib}
    ongo={() => table.update(sayGo(game))}
    oncount={() => table.update(showNext(game))}
    onnext={() => table.update(nextHand(game))}
    onrestart={restart}
  />
</Site>
