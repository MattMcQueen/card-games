<script lang="ts">
  import Dialog from './Dialog.svelte';

  const KOFI_URL = 'https://ko-fi.com/mattrarelywrites';

  let dialog: Dialog;
  // Ko-fi's page is only requested the first time the panel is opened: until then, nothing
  // from Ko-fi is loaded, so visitors who never ask for it never contact Ko-fi.
  let opened = $state(false);

  export function show() {
    // Ko-fi shows phones a layout built for a whole screen, which doesn't fit in a panel, so
    // on a phone its own page opens in a new tab instead.
    if (matchMedia('(max-width: 600px)').matches) {
      window.open(KOFI_URL, '_blank', 'noopener');
      return;
    }
    opened = true;
    dialog.show();
  }
</script>

<Dialog bind:this={dialog} title="Support me on Ko-fi" narrow>
  {#if opened}
    <iframe
      title="Support me on Ko-fi"
      src="{KOFI_URL}/?hidefeed=true&widget=true&embed=true"
      referrerpolicy="no-referrer"
    ></iframe>
  {/if}
  <p class="foot"><a href={KOFI_URL} rel="noopener" target="_blank">Open ko-fi.com/mattrarelywrites in a new tab</a></p>
</Dialog>

<style>
  iframe {
    display: block;
    width: 100%;
    /* As tall as the screen allows, so the whole form shows without much scrolling. */
    height: clamp(20rem, calc(100dvh - 9rem), 46rem);
    border: 0;
    background: #fff;
  }
  .foot {
    margin: 0;
    padding: 0.6rem 0.75rem 0.75rem;
    font-size: 0.9rem;
    text-align: center;
  }
  a {
    color: var(--ink);
  }
</style>
