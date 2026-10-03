<script lang="ts">
  import { untrack } from 'svelte';
  import { HAND_SIZE } from '../engine';
  import { bidText } from './labels';

  /** Choosing your bid: it starts at `suggestion`, what a computer player would bid with your cards. */
  let { suggestion, onbid }: { suggestion: number; onbid: (tricks: number) => void } = $props();

  let value = $state(untrack(() => suggestion));
</script>

<div class="picker" role="group" aria-label="Your bid">
  <button type="button" class="btn step" aria-label="One fewer" disabled={value <= 0} onclick={() => value--}>−</button>
  <output class="value" aria-live="polite">{value === 0 ? 'Nil' : value}</output>
  <button type="button" class="btn step" aria-label="One more" disabled={value >= HAND_SIZE} onclick={() => value++}>+</button>
  <button type="button" class="btn primary" onclick={() => onbid(value)}>Bid {bidText(value)}</button>
</div>

<style>
  .picker {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .step {
    min-width: 46px;
    padding-inline: 0;
    font-size: 1.3rem;
  }
  .value {
    min-width: 2.6rem;
    text-align: center;
    font-size: 1.4rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
</style>
