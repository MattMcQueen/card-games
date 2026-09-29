<script lang="ts">
  import { audio, setMuted, unlockAudio } from './sound.svelte';

  function toggle() {
    unlockAudio();
    setMuted(!audio.muted);
  }

  const label = $derived(audio.muted ? 'Turn sound on' : 'Mute sound');
</script>

<button type="button" class="sound" onclick={toggle} aria-label={label} aria-pressed={audio.muted} title={label}>
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 5 6 9H3v6h3l5 4z" />
    {#if audio.muted}
      <path d="m16 9 6 6M22 9l-6 6" />
    {:else}
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    {/if}
  </svg>
</button>

<style>
  .sound {
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
  .sound:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }
</style>
