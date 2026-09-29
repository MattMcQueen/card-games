<script lang="ts">
  import { audio, setMuted, unlockAudio } from './sound.svelte';

  function toggle() {
    unlockAudio();
    setMuted(!audio.muted);
  }

  const label = $derived(audio.muted ? 'Turn sound on' : 'Mute sound');
</script>

<button type="button" class="icon-btn" onclick={toggle} aria-label={label} aria-pressed={audio.muted} title={label}>
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 5 6 9H3v6h3l5 4z" />
    {#if audio.muted}
      <path d="m16 9 6 6M22 9l-6 6" />
    {:else}
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    {/if}
  </svg>
</button>
