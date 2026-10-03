<script lang="ts">
  import FourSeatTable from '@card-games/card-kit/FourSeatTable.svelte';
  import type { Origin } from '@card-games/card-kit/motion';
  import YourHand from '@card-games/card-kit/YourHand.svelte';
  import { HUMAN_SEAT, cardKey, legalCards, type Card, type GameState } from '../engine';
  import Plate from './Plate.svelte';
  import { bannerFor } from './verdict';
  import Scores from './Scores.svelte';

  let {
    game,
    yourCardFrom,
    onpick,
  }: {
    game: GameState;
    /** Where the card you last played was in your hand. */
    yourCardFrom: Origin;
    onpick: (card: Card, from: HTMLElement) => void;
  } = $props();

  const yourTurn = $derived(game.phase === 'playing' && game.toPlay === HUMAN_SEAT);
  const playable = $derived(new Set(legalCards(game, HUMAN_SEAT).map(cardKey)));
  const dealt = $derived(game.players[game.dealer]!);
</script>

<!-- You along the bottom, your partner across from you, and your opponents on your left and right. -->
<FourSeatTable {game} dealer={game.dealer} {yourCardFrom} banner={bannerFor(game)} info={[`Hand ${game.hand}`, dealt.human ? 'You deal' : `${dealt.name} deals`]}>
  {#snippet corner()}
    <Scores {game} />
  {/snippet}
  {#snippet plate(id: number)}
    <Plate player={game.players[id]!} {game} />
  {/snippet}
  {#snippet yourHand()}
    <YourHand
      cards={game.players[HUMAN_SEAT]!.hand}
      hand={game.hand}
      dealer={game.dealer}
      mode={yourTurn ? 'play' : 'wait'}
      {playable}
      {onpick}
    />
  {/snippet}
</FourSeatTable>
