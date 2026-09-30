<script lang="ts">
  import CardBack from './CardBack.svelte';

  /**
   * `scale` sizes the cards against the table's card size (--cw, --ch); `rise` is the extra height, in
   * pixels, that the stacked layers take up. `id="deck"` makes it where dealt cards fly out from.
   */
  let { id, scale = 1, rise = 9 }: { id?: string; scale?: number; rise?: number } = $props();
</script>

<!-- A squared-up pile of face-down cards: the deck on the table, or the cards in a shoe. -->
<div {id} class="pile" style="--scale: {scale}; --rise: {rise}px" aria-hidden="true">
  {#each [3, 2, 1, 0] as layer (layer)}
    <div class="layer" style="--layer: {layer}"><CardBack /></div>
  {/each}
</div>

<style>
  .pile {
    position: relative;
    width: calc(var(--cw) * var(--scale));
    height: calc(var(--ch) * var(--scale) + var(--rise));
    filter: drop-shadow(0 3px 4px rgb(0 0 0 / 0.5));
  }
  .layer {
    position: absolute;
    top: calc(var(--layer) * 3px);
    left: calc(var(--layer) * -1px);
    width: calc(var(--cw) * var(--scale));
    height: calc(var(--ch) * var(--scale));
  }
</style>
