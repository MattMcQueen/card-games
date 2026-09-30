<script lang="ts">
  import { preloadCards } from '@card-games/card-kit/cardImages';
  import { reducedMotion } from '@card-games/card-kit/motion';
  import { nav } from '@card-games/card-kit/router.svelte';
  import Site from '@card-games/card-kit/Site.svelte';
  import { unlockAudio } from '@card-games/card-kit/sound.svelte';
  import {
    act,
    isGameOver,
    legalActions,
    maxBet,
    newGame,
    nextRound,
    startRound,
    type Action,
  } from './engine';
  import About from './lib/About.svelte';
  import Controls from './lib/Controls.svelte';
  import { cuesFor, playCues } from './lib/cues';
  import HowToPlay from './lib/HowToPlay.svelte';
  import { shortcutFor } from './lib/keys';
  import { settleDelay } from './lib/motion';
  import Table from './lib/Table.svelte';
  import { announcementFor } from './lib/verdict';

  // The shoe is large and never edited in place, so it needs no deep reactivity.
  let game = $state.raw(newGame());
  let wanted = $state(10);

  // After the dealer plays, the results wait until the dealer's cards have landed.
  let revealed = $state(false);
  $effect(() => {
    if (game.phase !== 'settled') {
      revealed = false;
      return;
    }
    const id = setTimeout(() => (revealed = true), reducedMotion ? 0 : settleDelay(game.dealer.length));
    return () => clearTimeout(id);
  });

  const limit = $derived(maxBet(game));
  const bet = $derived(Math.min(wanted, limit));
  const actions = $derived(legalActions(game));
  const over = $derived(isGameOver(game));
  const settling = $derived(game.phase === 'settled' && !revealed);
  const showResults = $derived(game.phase === 'settled' && revealed);

  // Chips held, not counting winnings still to be revealed.
  const shownChips = $derived(
    settling
      ? game.chips - game.results.reduce((sum, r) => sum + r.returned, 0) - game.insuranceReturned
      : game.chips,
  );

  // Every change of game state goes through here so the matching sounds are played.
  // Browsers only start audio from a tap or key press, and all of these run from one.
  function update(next: typeof game) {
    unlockAudio();
    preloadCards();
    playCues(cuesFor(game, next));
    game = next;
  }

  function addChip(value: number) {
    unlockAudio();
    preloadCards();
    playCues([{ sound: 'chip', at: 0 }]);
    wanted = Math.min(bet + value, limit);
  }
  function restart() {
    unlockAudio();
    playCues([{ sound: 'shuffle', at: 0 }]);
    game = newGame();
    wanted = 10;
  }
  const play = (action: Action) => update(act(game, action));

  function onkeydown(event: KeyboardEvent) {
    // Only on the game page, and not while the Support me panel is open: then keys belong to it.
    if (nav.route !== 'game' || document.querySelector(':popover-open')) return;
    const action = shortcutFor(event, actions);
    if (!action) return;
    event.preventDefault();
    play(action);
  }
</script>

<svelte:window {onkeydown} onpointerdown={preloadCards} />
<Site name="Blackjack" {HowToPlay} {About}>
  <div class="sr-only" role="status" aria-live="polite">{showResults ? announcementFor(game) : ''}</div>

  <Table {game} {bet} {shownChips} {settling} {showResults} />
  <Controls
    {game}
    {bet}
    {limit}
    {actions}
    {showResults}
    {over}
    onchip={addChip}
    onclear={() => (wanted = 0)}
    ondeal={() => update(startRound(game, bet))}
    onplay={play}
    onnext={() => update(nextRound(game))}
    onrestart={restart}
  />
</Site>
