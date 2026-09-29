<script lang="ts">
  import type { Snippet } from 'svelte';

  let { title, children, narrow = false }: { title: string; children: Snippet; narrow?: boolean } = $props();

  let element: HTMLDialogElement;
  const titleId = `dialog-title-${Math.random().toString(36).slice(2, 8)}`;

  export function show() {
    element.showModal();
  }
  export function close() {
    element.close();
  }

  // Clicking the dark area outside the box closes it. Escape already does, natively.
  function onclick(event: MouseEvent) {
    if (event.target === element) element.close();
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog bind:this={element} class:narrow aria-labelledby={titleId} {onclick}>
  <header>
    <h2 id={titleId}>{title}</h2>
    <button type="button" class="close" onclick={close} aria-label="Close" title="Close">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  </header>
  <div class="body">
    {@render children()}
  </div>
</dialog>

<style>
  dialog {
    width: min(34rem, calc(100vw - 2rem));
    max-height: min(42rem, calc(100dvh - 2rem));
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 1rem;
    background: var(--panel);
    color: var(--ink);
    box-shadow: 0 20px 60px rgb(0 0 0 / 0.5);
    overflow: hidden;
  }
  /* A tall, slim panel for the Ko-fi form, which is laid out for a narrow column. */
  dialog.narrow {
    width: min(26rem, calc(100vw - 0.5rem));
    max-width: none; /* the browser default keeps dialogs 38px clear of the screen edges */
    max-height: calc(100dvh - 1rem);
  }
  dialog.narrow .body {
    padding: 0; /* the Ko-fi form needs about 340px of width, so it gets all of it */
  }
  dialog[open] {
    display: flex;
    flex-direction: column;
  }
  dialog::backdrop {
    background: rgb(0 0 0 / 0.65);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.8rem 1rem;
    border-bottom: 1px solid var(--line);
  }
  h2 {
    margin: 0;
    font: 700 1.2rem Georgia, 'Times New Roman', serif;
  }
  .close {
    display: inline-grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink);
    cursor: pointer;
  }
  .close:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 1px;
  }
  .body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 0.5rem 1rem 1rem;
    line-height: 1.5;
  }
</style>
