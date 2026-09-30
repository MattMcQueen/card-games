<script lang="ts">
  import CardBack from './CardBack.svelte';
</script>

<!-- The card shoe in the corner of the table, where dealt cards slide out from. -->
<div class="shoe" aria-hidden="true">
  {#each [3, 2, 1, 0] as layer (layer)}
    <div class="layer" style="--layer: {layer}"><CardBack /></div>
  {/each}
</div>

<style>
  .shoe {
    position: relative;
    width: calc(var(--cw) * 0.9);
    height: calc(var(--ch) * 0.9 + 12px);
    filter: drop-shadow(0 3px 4px rgb(0 0 0 / 0.5));
  }
  .layer {
    position: absolute;
    top: calc(var(--layer) * 3px);
    left: calc(var(--layer) * -1px);
    width: calc(var(--cw) * 0.9);
    height: calc(var(--ch) * 0.9);
  }
</style>
