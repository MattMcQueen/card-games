<script lang="ts">
  let { onclick }: { onclick: () => void } = $props();
</script>

<button type="button" class="kofi" {onclick} aria-label="Support me on Ko-fi" title="Support me on Ko-fi">
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
    <path d="M17 10h1.500a2.500 2.500 0 0 1 0 5H17" />
    <path d="M8 2v2M12 2v2" />
  </svg>
</button>

<style>
  .kofi {
    display: inline-grid;
    place-items: center;
    width: var(--icon-button);
    height: var(--icon-button);
    border: 1px solid var(--line);
    border-radius: 50%;
    background: var(--panel);
    color: var(--ink);
    cursor: pointer;
  }
  .kofi:hover {
    border-color: var(--accent);
  }
  .kofi:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }
</style>
