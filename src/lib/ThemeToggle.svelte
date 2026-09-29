<script lang="ts">
  // The choice lives only in this page (nothing is stored): a refresh goes back to the device setting.
  let override = $state<'light' | 'dark' | null>(null);
  const systemDark = () => matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = $derived(override ? override === 'dark' : systemDark());

  function toggle() {
    override = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = override;
  }

  const label = $derived(dark ? 'Switch to light mode' : 'Switch to dark mode');
</script>

<button type="button" class="theme" onclick={toggle} aria-label={label} title={label}>
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    {#if dark}
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    {:else}
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    {/if}
  </svg>
</button>

<style>
  .theme {
    display: inline-grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: var(--panel);
    color: var(--ink);
    cursor: pointer;
  }
  .theme:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }
</style>
