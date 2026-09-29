<!-- Printed lettering on the felt, like a real casino table. -->
<script lang="ts">
  /** Once the cards are out the lettering fades away, so it never shows through the hands. */
  let { faded = false }: { faded?: boolean } = $props();
</script>

<svg class="markings" class:faded viewBox="0 0 800 260" aria-hidden="true" focusable="false">
  <defs>
    <path id="arc-outer" d="M 70 60 A 400 200 0 0 0 730 60" />
    <path id="arc-inner" d="M 170 150 A 300 140 0 0 0 630 150" />
  </defs>
  <text class="big"><textPath href="#arc-outer" startOffset="50%" text-anchor="middle">BLACKJACK PAYS 3 TO 2</textPath></text>
  <text class="small"><textPath href="#arc-inner" startOffset="50%" text-anchor="middle">DEALER MUST STAND ON ALL 17s</textPath></text>
</svg>

<style>
  .markings {
    position: absolute;
    left: 50%;
    top: 50%;
    width: min(92%, 46rem);
    transform: translate(-50%, -55%);
    pointer-events: none;
    transition: opacity 0.4s;
  }
  .faded {
    opacity: 0;
  }
  text {
    fill: color-mix(in srgb, var(--gold) 38%, transparent);
    font-family: var(--serif);
    text-transform: uppercase;
  }
  .big {
    font-size: 34px;
    letter-spacing: 5px;
    font-weight: 700;
  }
  .small {
    font-size: 18px;
    letter-spacing: 4px;
  }
</style>
