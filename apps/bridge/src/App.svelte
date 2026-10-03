<script lang="ts">
  import { preloadCards } from '@card-games/card-kit/cardImages';
  import Site from '@card-games/card-kit/Site.svelte';
  import { fromRect } from '@card-games/card-kit/trickMotion';
  import { TurnTaker } from '@card-games/card-kit/turns.svelte';
  import { chooseCall, collect, decide, cardKey, isBotTurn, isYourTurn, makeCall, newGame, nextHand, playCard, type Card, type GameState } from './engine';
  import About from './lib/About.svelte';
  import Controls from './lib/Controls.svelte';
  import { cuesFor, playCues } from './lib/cues';
  import HowToPlay from './lib/HowToPlay.svelte';
  import { announcementFor } from './lib/labels';
  import Table from './lib/Table.svelte';

  /** Where the card last played face up was (your hand or the dummy), so it flies to the trick from there. */
  let yourCardFrom = $state.raw(fromRect(null));

  /** A computer player's card: if it comes from a face-up hand (the dummy, or yours when you are the dummy), it flies from its place there. */
  function botCard(game: GameState): GameState {
    const card = decide(game);
    const shown = document.querySelector(`[data-card="${cardKey(card)}"]`);
    if (shown) yourCardFrom = fromRect(shown.getBoundingClientRect());
    return playCard(game, card);
  }

  // The computer players call and play a little apart, and each complete trick waits a moment to be taken.
  const table = new TurnTaker(newGame(), {
    sounds: (prev, next) => playCues(cuesFor(prev, next)),
    isBotTurn,
    botMove: (game) => (game.phase === 'bidding' ? makeCall(game, chooseCall(game)) : botCard(game)),
    collect,
  });
  const game = $derived(table.game);

  function pick(card: Card, from: HTMLElement) {
    yourCardFrom = fromRect(from.getBoundingClientRect());
    table.update(playCard(game, card));
  }

  const announcement = $derived(announcementFor(game, isYourTurn(game)));
</script>

<svelte:window onpointerdown={preloadCards} />
<Site name="Bridge" {HowToPlay} {About}>
  <div class="sr-only" role="status" aria-live="polite">{announcement}</div>

  <Table {game} {yourCardFrom} onpick={pick} />
  <Controls
    {game}
    oncall={(call) => table.update(makeCall(game, call))}
    onnext={() => table.update(nextHand(game))}
    onrestart={() => table.update(newGame())}
  />
</Site>
