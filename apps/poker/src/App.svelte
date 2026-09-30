<script lang="ts">
  import {
    HUMAN_SEAT,
    act,
    decide,
    isBotTurn,
    isGameOver,
    legalActions,
    newGame,
    nextHand,
    type Action,
    type GameState,
  } from './engine';
  import About from './lib/About.svelte';
  import { preloadCards } from './lib/cardImages';
  import Controls from './lib/Controls.svelte';
  import { cuesFor } from './lib/cues';
  import HandLog from './lib/HandLog.svelte';
  import HowToPlay from './lib/HowToPlay.svelte';
  import { announcementFor } from './lib/labels';
  import { keyMove, keysActive } from './lib/keys';
  import { animationTime, revealDelay, thinkTime } from './lib/motion';
  import { nav } from './lib/router.svelte';
  import SiteHeader from './lib/SiteHeader.svelte';
  import { playCues, unlockAudio } from './lib/sound.svelte';
  import Sprites from './lib/Sprites.svelte';
  import SupportMe from './lib/SupportMe.svelte';
  import Table from './lib/Table.svelte';

  // The deck is never edited in place, so the state needs no deep reactivity.
  let game = $state.raw(newGame());
  /** The first board card dealt by the latest move: cards before it are already on the table. */
  let boardFrom = $state(0);
  /** The result of a settled hand is shown once its cards have been dealt. */
  let revealed = $state(false);
  /** The raise being set up, or null for the smallest one. */
  let wanted = $state<number | null>(null);

  // Not reactive: read when the timers below are set.
  let revealWait = 0;
  let animatingUntil = 0;

  const legal = $derived(legalActions(game));
  const yourTurn = $derived(game.phase === 'action' && game.toAct === HUMAN_SEAT);
  const over = $derived(isGameOver(game));
  const amount = $derived(Math.min(legal.maxRaiseTo, Math.max(legal.minRaiseTo, wanted ?? legal.minRaiseTo)));

  // Every change of game state goes through here so the matching sounds are played.
  // Browsers only start audio from a tap or key press, and all of these run from one.
  function update(next: GameState) {
    unlockAudio();
    preloadCards();
    playCues(cuesFor(game, next));
    const newHand = next.hand !== game.hand;
    const from = newHand ? 0 : game.board.length;
    // The computer players wait for the cards to land before they act.
    animatingUntil = Math.max(animatingUntil, performance.now() + animationTime(game, next));
    if (next.phase === 'settled') revealWait = revealDelay(from, next.board.length, next.showdown);
    boardFrom = from;
    wanted = null;
    game = next;
  }

  $effect(() => {
    if (game.phase !== 'settled') {
      revealed = false;
      return;
    }
    const id = setTimeout(() => (revealed = true), revealWait);
    return () => clearTimeout(id);
  });

  // The computer players take their turns, a little apart so you can follow what they do. Once you
  // have folded the rest of the hand is played out quickly.
  $effect(() => {
    if (!isBotTurn(game)) return;
    const wait = thinkTime(!game.seats[HUMAN_SEAT]?.folded, animatingUntil - performance.now(), Math.random());
    const id = setTimeout(() => update(act(game, decide(game))), wait);
    return () => clearTimeout(id);
  });

  const play = (action: Action) => update(act(game, action));
  const raise = () => play({ type: 'raise', to: amount });
  const call = () => play({ type: legal.canCall ? 'call' : 'check' });
  function restart() {
    unlockAudio();
    playCues([{ sound: 'shuffle', at: 0 }]);
    boardFrom = 0;
    wanted = null;
    game = newGame();
  }

  function onkeydown(event: KeyboardEvent) {
    // Not while the Support me panel is open: then keys belong to it.
    if (!keysActive(nav.route === 'game', yourTurn, !!document.querySelector(':popover-open'))) return;
    const move = keyMove(event, legal, amount);
    if (!move) return;
    event.preventDefault();
    play(move);
  }

  const announcement = $derived(announcementFor(game, legal, yourTurn, revealed));
</script>

<svelte:window {onkeydown} onpointerdown={preloadCards} />
<Sprites />

<a class="skip" href="#main">Skip to content</a>
<SiteHeader />

<!-- The game stays in the page while you read How to play, so a hand is never lost. -->
<main id="main" class="wrap" tabindex="-1">
  <div class="game" hidden={nav.route !== 'game'}>
    <h1 class="sr-only">Texas Hold'em</h1>
    <div class="sr-only" role="status" aria-live="polite">{announcement}</div>

    <Table {game} {boardFrom} {revealed} />
    <Controls
      {game}
      {legal}
      {yourTurn}
      {over}
      showResults={revealed}
      {amount}
      onfold={() => play({ type: 'fold' })}
      oncall={call}
      onraise={raise}
      onamount={(to) => (wanted = to)}
      onnext={() => update(nextHand(game))}
      onrestart={restart}
    />
    <HandLog {game} />
  </div>

  {#if nav.route === 'how-to-play'}
    <HowToPlay />
  {:else if nav.route === 'about'}
    <About />
  {/if}
</main>

<footer class="site-footer">
  <div class="wrap">
    <p class="disclosure">Just for fun: chips have no value and no real money is involved. Refreshing the page starts a new game.</p>
  </div>
</footer>

<SupportMe />

<style>
  main {
    padding-top: 20px;
    padding-bottom: 32px;
    min-height: 60vh;
  }
  main:focus {
    outline: none; /* it only takes focus when the page changes */
  }
  .game {
    display: grid;
    gap: 0.9rem;
  }
  .game[hidden] {
    display: none;
  }

  .site-footer {
    padding-bottom: 80px; /* room for the Support me button */
    font-size: 15px;
    color: var(--muted);
  }
  .site-footer .wrap {
    padding-top: 24px;
    border-top: 1px solid var(--line);
  }
  .site-footer p {
    margin: 0 0 10px;
  }
  .disclosure {
    color: var(--fg);
    font-weight: 600;
    text-align: center;
  }
</style>
