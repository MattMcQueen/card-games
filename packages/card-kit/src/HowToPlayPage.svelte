<script lang="ts">
  import type { Snippet } from 'svelte';
  import { follow } from './router.svelte';

  /** The How to play page: its `title` and `intro`, a way back to the game, and the game's rules as `children` (list items). */
  let { title, intro, children }: { title: string; intro: string; children: Snippet } = $props();
</script>

<div class="page">
  <section class="hero">
    <span class="kicker">How to play</span>
    <h1>{title}</h1>
    <p>{intro}</p>
    <a class="btn primary" href="/" onclick={follow('game')}>Back to the game</a>
  </section>

  <ul class="facts">
    {@render children()}
  </ul>
</div>
