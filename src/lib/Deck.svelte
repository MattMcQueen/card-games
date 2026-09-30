<script lang="ts">
  import CardBack from './CardBack.svelte';
</script>

<!-- The deck on the table, where dealt cards fly out from. -->
<div id="deck" class="deck" aria-hidden="true">
  {#each [3, 2, 1, 0] as layer (layer)}
    <div class="layer" style="--layer: {layer}"><CardBack /></div>
  {/each}
</div>

<style>
  .deck {
    position: relative;
    width: var(--cw);
    height: calc(var(--ch) + 9px);
    filter: drop-shadow(0 3px 4px rgb(0 0 0 / 0.5));
  }
  .layer {
    position: absolute;
    top: calc(var(--layer) * 3px);
    left: calc(var(--layer) * -1px);
    width: var(--cw);
    height: var(--ch);
  }
</style>
