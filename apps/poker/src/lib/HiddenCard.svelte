<script lang="ts">
  import CardBack from '@card-games/card-kit/CardBack.svelte';
  import { dealt } from '@card-games/card-kit/motion';

  /** `dim`: darkened, as the cards of a player who has folded. */
  let { delay = 0, dim = false }: { delay?: number; dim?: boolean } = $props();
</script>

<!-- A card face down on the table: an opponent's hole card until it is turned over. -->
<div class="card" class:dim use:dealt={{ delay }}><CardBack /></div>

<style>
  .card {
    width: var(--cw);
    height: var(--ch);
    flex: none;
    position: relative;
    /* A shadow and a shade rather than filters, which iOS Safari mishandled here (see PlayingCard). */
    border-radius: 8% / 5.7%;
    box-shadow: 0 2px 3px rgb(0 0 0 / 0.55);
  }
  .card::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: rgb(0 0 0 / 0.45);
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
  }
  .dim::after {
    opacity: 1;
  }
</style>
