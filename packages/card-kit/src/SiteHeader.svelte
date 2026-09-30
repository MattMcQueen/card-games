<script lang="ts">
  import { follow, nav } from './router.svelte';
  import { routes, titleFor } from './routes';
  import SoundToggle from './SoundToggle.svelte';
  import ThemeToggle from './ThemeToggle.svelte';

  /** `name` is shown as the logo; `title`, in the tab titles, can differ in its typography. */
  let { name, title = name }: { name: string; title?: string } = $props();

  $effect.pre(() => {
    document.title = titleFor(nav.route, title);
  });
</script>

<header class="site-header">
  <div class="wrap bar">
    <a class="logo" href="/" onclick={follow('game')}>
      <!-- The favicon: a sticker with a card and a chip, like Brand New’s book and record. -->
      <svg class="logo-mark" viewBox="0 0 32 32" width="44" height="44" aria-hidden="true" focusable="false">
        <polygon points="16.0,0.5 18.8,3.7 22.7,2.0 23.9,6.1 28.1,6.3 27.4,10.5 31.1,12.6 28.6,16.0 31.1,19.4 27.4,21.5 28.1,25.7 23.9,25.9 22.7,30.0 18.8,28.3 16.0,31.5 13.2,28.3 9.3,30.0 8.1,25.9 3.9,25.7 4.6,21.5 0.9,19.4 3.4,16.0 0.9,12.6 4.6,10.5 3.9,6.3 8.1,6.1 9.3,2.0 13.2,3.7" fill="#c2410c" />
        <circle cx="19" cy="16" r="7.2" fill="#fff" />
        <circle cx="19" cy="16" r="4.4" fill="none" stroke="#c2410c" stroke-width=".9" />
        <circle cx="19" cy="16" r="1.6" fill="#c2410c" />
        <rect x="7.2" y="9" width="8.4" height="14" rx="1.2" fill="#fff" stroke="#c2410c" stroke-width="1.4" />
        <path fill="#c2410c" d="M11.4 11.8c-2.2 2-3.2 3.2-3.2 4.5a1.5 1.5 0 0 0 2.5 1.1c-.1 1-.4 1.6-.9 2.1h3.2c-.5-.5-.8-1.1-.9-2.1a1.5 1.5 0 0 0 2.5-1.1c0-1.3-1-2.5-3.2-4.5z" />
      </svg>{name}</a>
    <nav class="nav" aria-label="Sections">
      {#each routes as { route, path, label } (route)}
        <a href={path} onclick={follow(route)} aria-current={nav.route === route ? 'page' : undefined}>{label}</a>
      {/each}
    </nav>
    <div class="tools">
      <SoundToggle />
      <ThemeToggle />
    </div>
  </div>
</header>

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 5;
    border-bottom: 1px solid var(--line);
    background: var(--bg);
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 16px;
    row-gap: 2px;
    min-height: 76px;
    padding-block: 14px;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    font: 400 26px/1.15 var(--serif);
    color: var(--fg);
    text-decoration: none;
    white-space: nowrap;
  }
  .logo-mark {
    flex: none;
    width: 44px;
    height: 44px;
  }
  .nav {
    display: flex;
    gap: 4px;
    margin-left: auto;
    font-size: 16px;
    font-weight: 600;
  }
  .nav a {
    padding: 12px 20px;
    border-radius: 999px;
    color: var(--fg);
    text-decoration: none;
  }
  .nav a:hover,
  .nav a[aria-current] {
    background: var(--panel);
  }
  .tools {
    display: flex;
    gap: 8px;
  }

  /* Phones, as on Brand New: a smaller logo, and the links on a second row under it */
  @media (max-width: 639px) {
    .bar {
      min-height: 0;
      padding-block: 10px 6px;
    }
    .logo {
      font-size: 20px;
      gap: 10px;
    }
    .logo-mark {
      width: 36px;
      height: 36px;
    }
    .tools {
      margin-left: auto;
    }
    .nav {
      order: 1;
      width: 100%;
      margin-left: -12px;
      font-size: 15px;
    }
    .nav a {
      padding: 8px 12px;
    }
  }
</style>
