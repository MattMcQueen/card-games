<script lang="ts">
  import CardBack from '@card-games/card-kit/CardBack.svelte';
  import { deal } from '@card-games/card-kit/motion';

  let { delay = 0 }: { delay?: number } = $props();
</script>

<!-- A card face down on the table: an opponent's hole card until it is turned over. -->
<div class="card" in:deal|global={{ delay }}><CardBack /></div>

<style>
  .card {
    width: var(--cw);
    height: var(--ch);
    flex: none;
    filter: drop-shadow(0 2px 3px rgb(0 0 0 / 0.55));
  }
</style>
