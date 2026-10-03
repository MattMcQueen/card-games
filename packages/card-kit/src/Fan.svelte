<script lang="ts">
  import CardBack from './CardBack.svelte';
  import { dealt } from './motion';
  import { dealDelay, dealOrder } from './trickMotion';

  /** `count` face-down cards held by `seat`, dealt afresh for each `hand` by `dealer`. */
  let { seat, count, hand, dealer }: { seat: number; count: number; hand: number; dealer: number } = $props();

  const order = $derived(dealOrder(seat, dealer));
</script>

<!-- A computer player's hand: its cards face down in a tight fan. Cards it plays fly out from here. -->
<div class="fan" id="fan-{seat}" style:--n={count} aria-label="{count} cards" role="img">
  {#each { length: count } as _, i (`${hand}-${i}`)}
    <div class="back" use:dealt={{ delay: dealDelay(order, i) }}><CardBack /></div>
  {/each}
</div>

<style>
  .fan {
    display: flex;
    justify-content: center;
    min-width: var(--cw);
    min-height: var(--ch);
  }
  .back {
    flex: none;
    width: var(--cw);
    height: var(--ch);
    border-radius: 8% / 5.7%;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.5);
  }
  .back + .back {
    margin-left: calc(var(--cw) * (var(--fan-step, 0.2) - 1));
  }
</style>
