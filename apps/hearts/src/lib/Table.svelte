<script lang="ts">
  import FourSeatTable from '@card-games/card-kit/FourSeatTable.svelte';
  import type { Origin } from '@card-games/card-kit/motion';
  import YourHand from '@card-games/card-kit/YourHand.svelte';
  import { HUMAN_SEAT, PLAYERS, cardKey, legalCards, passSource, type Card, type GameState } from '../engine';
  import { directionLabel } from './labels';
  import Plate from './Plate.svelte';
  import { bannerFor } from './verdict';

  let {
    game,
    selected,
    yourCardFrom,
    onpick,
  }: {
    game: GameState;
    /** The cards chosen to pass (as "QS"). */
    selected: ReadonlySet<string>;
    /** Where the card you last played was in your hand. */
    yourCardFrom: Origin;
    onpick: (card: Card, from: HTMLElement) => void;
  } = $props();

  const you = $derived(game.players[HUMAN_SEAT]!);
  const yourTurn = $derived(game.phase === 'playing' && game.toPlay === HUMAN_SEAT);
  const mode = $derived(game.phase === 'passing' ? 'pass' : yourTurn ? 'play' : 'wait');
  const playable = $derived(new Set(legalCards(game, HUMAN_SEAT).map(cardKey)));
  // The cards passed to you stand out until the first trick has been played.
  const received = $derived(new Set(game.tricksPlayed === 0 ? you.received.map(cardKey) : []));
  /** Nobody deals in Hearts: the cards go round from your left, as if the player on your right dealt. */
  const dealer = PLAYERS - 1;
</script>

<FourSeatTable {game} {dealer} {yourCardFrom} banner={bannerFor(game)} info={[`Hand ${game.hand}`, directionLabel(game)]}>
  {#snippet plate(id: number)}
    <Plate player={game.players[id]!} {game} />
  {/snippet}
  {#snippet yourHand()}
    <YourHand
      cards={you.hand}
      hand={game.hand}
      {dealer}
      {mode}
      {playable}
      {selected}
      {received}
      receivedFrom={passSource(HUMAN_SEAT, game.direction)}
      {onpick}
    />
  {/snippet}
</FourSeatTable>
