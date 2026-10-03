<script lang="ts">
  import ResultBanner from '@card-games/card-kit/ResultBanner.svelte';
  import type { GameState } from '../engine';
  import { bannerFor } from './verdict';

  let { game }: { game: GameState } = $props();

  const banner = $derived(bannerFor(game));
</script>

{#if banner}
  <ResultBanner {...banner} />
{/if}
