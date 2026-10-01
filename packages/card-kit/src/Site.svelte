<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import { nav } from './router.svelte';
  import SiteHeader from './SiteHeader.svelte';
  import Sprites from './Sprites.svelte';
  import SupportMe from './SupportMe.svelte';

  /**
   * The page every game sits in: the header, the game itself (`children`), its How to play and About pages,
   * and the Support me button. `name` is the logo; `title`, in tab titles and for screen
   * readers, can differ in its typography.
   */
  let {
    name,
    title = name,
    HowToPlay,
    About,
    children,
  }: { name: string; title?: string; HowToPlay: Component; About: Component; children: Snippet } = $props();
</script>

<Sprites />

<a class="skip" href="#main">Skip to content</a>
<SiteHeader {name} {title} />

<!-- The game stays in the page while you read How to play, so a game in progress is never lost. -->
<main id="main" class="wrap" tabindex="-1">
  <div class="game" hidden={nav.route !== 'game'}>
    <h1 class="sr-only">{title}</h1>
    {@render children()}
  </div>

  {#if nav.route === 'how-to-play'}
    <HowToPlay />
  {:else if nav.route === 'about'}
    <About />
  {/if}
</main>

<SupportMe {name} />

<style>
  main {
    padding-top: 20px;
    padding-bottom: 80px; /* room for the Support me button */
    min-height: 60vh;
  }
  main:focus {
    outline: none; /* it only takes focus when the page changes */
  }
  .game {
    display: grid;
    gap: 0.9rem;
  }
  .game[hidden] {
    display: none;
  }
</style>
