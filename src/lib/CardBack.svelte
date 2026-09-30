<script lang="ts">
  import { deal } from './motion';

  let { delay = 0 }: { delay?: number } = $props();
</script>

<!-- The back of a card: an opponent's hole cards until they are turned over. -->
<svg class="back" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true" in:deal|global={{ delay }}>
  <rect x="0.75" y="0.75" width="98.5" height="138.5" rx="8" fill="#fdfcf8" stroke="#c9c5b8" />
  <rect x="7" y="7" width="86" height="126" rx="4" fill="url(#card-back-pattern)" />
  <rect x="7" y="7" width="86" height="126" rx="4" fill="none" stroke="#fdfcf8" stroke-width="1.5" />
</svg>

<style>
  .back {
    width: var(--cw);
    height: var(--ch);
    flex: none;
    filter: drop-shadow(0 2px 3px rgb(0 0 0 / 0.55));
  }
</style>
