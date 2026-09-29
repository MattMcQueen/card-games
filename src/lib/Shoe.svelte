<!-- The card shoe in the corner of the table, where dealt cards slide out from. -->
<div class="shoe" aria-hidden="true">
  {#each [3, 2, 1, 0] as layer (layer)}
    <svg class="back" viewBox="0 0 100 140" style="--layer: {layer}">
      <rect x="0.75" y="0.75" width="98.5" height="138.5" rx="8" fill="#fdfcf8" stroke="#c9c5b8" />
      <rect x="7" y="7" width="86" height="126" rx="4" fill="url(#card-back-pattern)" />
      <rect x="7" y="7" width="86" height="126" rx="4" fill="none" stroke="#fdfcf8" stroke-width="1.5" />
    </svg>
  {/each}
</div>

<style>
  .shoe {
    position: relative;
    width: calc(var(--cw) * 0.9);
    height: calc(var(--ch) * 0.9 + 12px);
    filter: drop-shadow(0 3px 4px rgb(0 0 0 / 0.5));
  }
  .back {
    position: absolute;
    top: calc(var(--layer) * 3px);
    left: calc(var(--layer) * -1px);
    width: calc(var(--cw) * 0.9);
    height: calc(var(--ch) * 0.9);
  }
</style>
