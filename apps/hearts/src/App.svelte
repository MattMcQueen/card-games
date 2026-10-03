<script lang="ts">
  import { preloadCards } from '@card-games/card-kit/cardImages';
  import Site from '@card-games/card-kit/Site.svelte';
  import { unlockAudio } from '@card-games/card-kit/sound.svelte';
  import {
    HUMAN_SEAT,
    PASS_SIZE,
    cardKey,
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
  import { animationTime, collectWait, fromRect, thinkTime } from './lib/motion';
  import Table from './lib/Table.svelte';

  // Cards are never edited in place, so the state needs no deep reactivity.
  let game = $state.raw(newGame());
  /** The cards chosen to pass, as "QS". */
  let selected = $state.raw<ReadonlySet<string>>(new Set());
  /** Where the card you last played was, so it flies to the trick from there. */
  let yourCardFrom = $state.raw(fromRect(null));

  // Not reactive: read when the timers below are set.
  let animatingUntil = 0;

  // Every change of game state goes through here so the matching sounds are played.
  // Browsers only start audio from a tap or key press, and the first change comes from one.
  function update(next: GameState) {
    unlockAudio();
    preloadCards();
    playCues(cuesFor(game, next));
    animatingUntil = Math.max(animatingUntil, performance.now() + animationTime(game, next));
    game = next;
  }

  // The computer players take their turns a little apart so you can follow them, and a complete
  // trick stays on the table for a moment before whoever won it takes it.
  $effect(() => {
    const landing = animatingUntil - performance.now();
    if (isBotTurn(game)) {
      const id = setTimeout(() => update(playCard(game, decide(game))), thinkTime(landing, Math.random()));
      return () => clearTimeout(id);
    }
    if (game.phase === 'collecting') {
      const id = setTimeout(() => update(collect(game)), collectWait(landing));
      return () => clearTimeout(id);
    }
  });

  function pick(card: Card, from: HTMLElement) {
    const key = cardKey(card);
    if (game.phase === 'passing') {
      const next = new Set(selected);
      if (next.has(key)) next.delete(key);
      else if (next.size < PASS_SIZE) next.add(key);
      selected = next;
      return;
    }
    yourCardFrom = fromRect(from.getBoundingClientRect());
    update(playCard(game, card));
  }

  function pass() {
    const mine = game.players[HUMAN_SEAT]!.hand.filter((c) => selected.has(cardKey(c)));
    const picks = game.players.map((p) => (p.human ? mine : choosePass(game, p.id)));
    selected = new Set();
    update(passCards(game, picks));
  }

  function restart() {
    selected = new Set();
    update(newGame());
  }

  const yourTurn = $derived(game.phase === 'playing' && game.toPlay === HUMAN_SEAT);
  const announcement = $derived(announcementFor(game, yourTurn));
</script>

<svelte:window onpointerdown={preloadCards} />
<Site name="Hearts" {HowToPlay} {About}>
  <div class="sr-only" role="status" aria-live="polite">{announcement}</div>

  <Table {game} {selected} {yourCardFrom} onpick={pick} />
  <Controls {game} chosen={selected.size} onpass={pass} onnext={() => update(nextHand(game))} onrestart={restart} />
</Site>
