<script lang="ts">
  import { preloadCards } from '@card-games/card-kit/cardImages';
  import Site from '@card-games/card-kit/Site.svelte';
  import { animationTime, fromRect } from '@card-games/card-kit/trickMotion';
  import { CardChoice } from '@card-games/card-kit/choice.svelte';
  import { TurnTaker } from '@card-games/card-kit/turns.svelte';
  import {
    HUMAN_SEAT,
    PASS_SIZE,
    choosePass,
    collect,
    decide,
    isBotTurn,
    newGame,
    nextHand,
    passCards,
    playCard,
    type Card,
    type GameState,
  } from './engine';
  import About from './lib/About.svelte';
  import Controls from './lib/Controls.svelte';
  import { cuesFor, playCues } from './lib/cues';
  import HowToPlay from './lib/HowToPlay.svelte';
  import { announcementFor } from './lib/labels';
  import Table from './lib/Table.svelte';

  // The computer players take their turns a little apart, and each complete trick waits a moment to be taken.
  const table = new TurnTaker(newGame(), {
    sounds: (prev, next) => playCues(cuesFor(prev, next)),
    // The cards passed to you land in your hand.
    moving: (prev, next) => animationTime(prev, next, prev.phase === 'passing' && next.phase !== 'passing'),
    isBotTurn,
    botMove: (game) => playCard(game, decide(game)),
    collect,
  });
  const game = $derived(table.game);
  const update = (next: GameState) => table.update(next);

  /** The cards chosen to pass. */
  const chosen = new CardChoice(PASS_SIZE);
  /** Where the card you last played was, so it flies to the trick from there. */
  let yourCardFrom = $state.raw(fromRect(null));

  function pick(card: Card, from: HTMLElement) {
    if (game.phase === 'passing') {
      chosen.toggle(card);
      return;
    }
    yourCardFrom = fromRect(from.getBoundingClientRect());
    update(playCard(game, card));
  }

  function pass() {
    const mine = chosen.take(game.players[HUMAN_SEAT]!.hand);
    const picks = game.players.map((p) => (p.human ? mine : choosePass(game, p.id)));
    update(passCards(game, picks));
  }

  function restart() {
    chosen.clear();
    update(newGame());
  }

  const yourTurn = $derived(game.phase === 'playing' && game.toPlay === HUMAN_SEAT);
  const announcement = $derived(announcementFor(game, yourTurn));
</script>

<svelte:window onpointerdown={preloadCards} />
<Site name="Hearts" {HowToPlay} {About}>
  <div class="sr-only" role="status" aria-live="polite">{announcement}</div>

  <Table {game} selected={chosen.keys} {yourCardFrom} onpick={pick} />
  <Controls {game} chosen={chosen.keys.size} onpass={pass} onnext={() => update(nextHand(game))} onrestart={restart} />
</Site>
