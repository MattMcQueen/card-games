<script lang="ts">
  import logo from './kofi-logo.png';

  const KOFI_URL = 'https://ko-fi.com/mattrarelywrites';

  let button: HTMLButtonElement;
  let panel: HTMLDivElement;
  let tucked = $state(false);
  // Ko-fi's page is only requested the first time the panel is opened: until then, nothing
  // from Ko-fi is loaded, so visitors who never ask for it never contact Ko-fi.
  let opened = $state(false);

  function toggle() {
    // Ko-fi shows phones a layout built for a whole screen, which doesn't fit in a panel, so
    // on a phone its own page opens in a new tab instead.
    if (matchMedia('(max-width: 600px)').matches) {
      window.open(KOFI_URL, '_blank', 'noopener');
      return;
    }
    opened = true;
    panel.togglePopover();
  }

  // Keep the button from covering other buttons: while a button or small link is underneath it,
  // it slides out of the way. Big click targets don't count, since covering a corner of one
  // doesn't stop you clicking it. (The same as on Brand New.)
  let queued = false;
  function coversControl() {
    const r = button.getBoundingClientRect();
    const limit = r.width * r.height * 4;
    const points: [number, number][] = [
      [r.left + 2, r.top + 2],
      [r.right - 2, r.top + 2],
      [r.left + 2, r.bottom - 2],
      [r.right - 2, r.bottom - 2],
      [(r.left + r.right) / 2, (r.top + r.bottom) / 2],
    ];
    return points.some(([x, y]) =>
      document.elementsFromPoint(x, y).some((el) => {
        if (button.contains(el) || panel.contains(el)) return false;
        const control = el.closest('a, button, input, select, textarea, summary');
        if (!control) return false;
        const box = control.getBoundingClientRect();
        return box.width * box.height < limit;
      }),
    );
  }
  function update() {
    queued = false;
    tucked = false; // measure where it would be
    if (!panel.matches(':popover-open')) tucked = coversControl();
  }
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  // The page changes shape as the game goes on, so look again whenever it does.
  $effect(() => {
    const observer = new ResizeObserver(queue);
    observer.observe(document.body);
    queue();
    return () => observer.disconnect();
  });
</script>

<svelte:window onscroll={queue} onresize={queue} />

<aside class="support" aria-label="Support Blackjack">
  <button
    bind:this={button}
    type="button"
    class="support-btn"
    class:is-tucked={tucked}
    onclick={toggle}
    title="Support Blackjack on Ko-fi"
    aria-label="Support me on Ko-fi"
  >
    <img src={logo} width="39" height="31" alt="" /><span>Support me</span>
  </button>
  <div class="support-panel" bind:this={panel} popover="auto" ontoggle={queue}>
    <div class="support-head">
      <p><strong>Support Blackjack</strong></p>
      <button class="icon-btn" type="button" onclick={() => panel.hidePopover()} title="Close" aria-label="Close">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
    <div class="support-frame">
      {#if opened}
        <iframe
          title="Support Blackjack on Ko-fi"
          src="{KOFI_URL}/?hidefeed=true&widget=true&embed=true"
          referrerpolicy="no-referrer"
        ></iframe>
      {/if}
    </div>
    <p class="support-foot"><a href={KOFI_URL} rel="noopener" target="_blank">Open ko-fi.com/mattrarelywrites in a new tab</a></p>
  </div>
</aside>

<style>
  /* Bottom-left, like Brand New's; the panel opens above it. It matches Ko-fi's own floating
     button: its colour, DM Sans and the Ko-fi logo, all hosted here. */
  .support-btn {
    position: fixed;
    left: 16px;
    bottom: 16px;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 46px;
    padding: 0 20px;
    border: 0;
    border-radius: 100px;
    background: #a84e2b;
    color: #fff;
    font: 600 16px/normal 'DM Sans', sans-serif;
    cursor: pointer;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
  .support-btn img {
    width: 39px;
    height: auto;
  }
  .support-btn.is-tucked {
    transform: translateY(calc(100% + 24px));
    opacity: 0;
    pointer-events: none;
  }
  .support-btn.is-tucked:focus-visible {
    transform: none; /* keyboard users can still reach it */
    opacity: 1;
    pointer-events: auto;
  }

  .support-panel {
    position: fixed;
    inset: auto auto 72px 16px;
    margin: 0;
    padding: 0;
    width: min(340px, calc(100vw - 32px));
    flex-direction: column;
    border: 1px solid var(--line-strong);
    border-radius: 20px;
    overflow: hidden;
    background: var(--surface);
    color: var(--fg);
    box-shadow: 0 8px 30px rgb(0 0 0 / 0.3);
    /* Opens and closes like Ko-fi's own widget: it's pinned just above the button, so growing
       its height sweeps it up the page. */
    height: 0;
    opacity: 0;
    transition: height 0.3s ease, opacity 0.3s linear, overlay 0.3s allow-discrete, display 0.3s allow-discrete;
  }
  .support-panel:popover-open {
    display: flex;
    height: min(600px, calc(100dvh - 96px));
    opacity: 1;
    transition: height 0.5s ease, opacity 0.3s linear, overlay 0.5s allow-discrete, display 0.5s allow-discrete;
  }
  @starting-style {
    .support-panel:popover-open {
      height: 0;
      opacity: 0;
    }
  }
  .support-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 8px 8px 14px;
    border-bottom: 1px solid var(--line);
  }
  .support-head p {
    margin: 0;
  }
  .support-frame {
    flex: 1;
    background: #fff; /* Ko-fi's form is light */
  }
  iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
  }
  .support-foot {
    margin: 0;
    padding: 8px 14px;
    border-top: 1px solid var(--line);
    font-size: 0.8rem;
    text-align: center;
  }
</style>
