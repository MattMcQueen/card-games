<script lang="ts">
  import FourSeatTable from '@card-games/card-kit/FourSeatTable.svelte';
  import type { Origin } from '@card-games/card-kit/motion';
  import YourHand from '@card-games/card-kit/YourHand.svelte';
  import { HUMAN_SEAT, cardKey, dummyOf, dummyShown, isYourTurn, legalCards, trumpsOf, type Card, type GameState } from '../engine';
  import Dummy from './Dummy.svelte';
  import { contractBy } from './labels';
  import Plate from './Plate.svelte';
  import Scores from './Scores.svelte';
  import { bannerFor } from './verdict';

  let {
    game,
    yourCardFrom,
    onpick,
  }: {
    game: GameState;
    /** Where the card last played face up was: in your hand, or the dummy's. */
    yourCardFrom: Origin;
    onpick: (card: Card, from: HTMLElement) => void;
  } = $props();

  const yourPlay = $derived(game.phase === 'playing' && isYourTurn(game));
  /** The cards you may play now from the hand whose turn it is: yours, or the dummy's when you declare. */
  const playable = $derived(new Set(yourPlay ? legalCards(game).map(cardKey) : []));
  /** The dummy, face up once the opening lead is made (unless it is you: your cards are always face up). */
  const open = $derived(dummyShown(game) && dummyOf(game.contract) !== HUMAN_SEAT ? dummyOf(game.contract) : -1);
  const dealt = $derived(game.players[game.dealer]!);
  const info = $derived([
    `Hand ${game.hand}`,
    game.contract && game.phase !== 'bidding' ? contractBy(game, game.contract) : dealt.human ? 'You deal' : `${dealt.name} deals`,
  ]);
  const table = $derived({ ...game, tricksPlayed: game.taken.length });
  const none: ReadonlySet<string> = new Set();
  /** Your own cards are to play from (rather than the dummy's). */
  const yourHandsTurn = $derived(yourPlay && game.toPlay === HUMAN_SEAT);
</script>

<!-- You along the bottom, your partner across from you, and your opponents on your left and right. -->
<FourSeatTable game={table} dealer={game.dealer} {yourCardFrom} banner={bannerFor(game)} {info} {open}>
  {#snippet corner()}
    <Scores {game} />
  {/snippet}
  {#snippet openHand(id: number)}
    <Dummy
      seat={id}
      name={game.players[id]!.name}
      cards={game.players[id]!.hand}
      trumps={trumpsOf(game.contract)}
      playable={game.toPlay === id ? playable : none}
      {onpick}
    />
  {/snippet}
  {#snippet plate(id: number)}
    <Plate player={game.players[id]!} {game} />
  {/snippet}
  {#snippet yourHand()}
    <YourHand mode={yourHandsTurn ? 'play' : 'wait'} playable={yourHandsTurn ? playable : none} cards={game.players[HUMAN_SEAT]!.hand} hand={game.hand} dealer={game.dealer} {onpick} />
  {/snippet}
</FourSeatTable>
