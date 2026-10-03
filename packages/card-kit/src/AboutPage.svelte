<script lang="ts">
  import type { Snippet } from 'svelte';
  import { follow } from './router.svelte';
  import { build } from './version';

  /**
   * The About page every game has. A game passes in what differs: its `intro`, what is `kept` only while the
   * page is open ("Your chips"), which sounds are `recorded` and which `jingles` are made in the browser,
   * its `folder` under apps/ on GitHub, how its `keyboard` works and, if it has computer players, its `fairPlay`.
   */
  let {
    intro,
    kept,
    recorded,
    jingles,
    folder,
    keyboard,
    fairPlay,
  }: {
    intro: string;
    kept: string;
    recorded: string;
    jingles: string;
    folder: string;
    keyboard: Snippet;
    fairPlay?: Snippet;
  } = $props();
</script>

<div class="page">
  <section class="hero">
    <span class="kicker">About and privacy</span>
    <h1>Just for fun, and nothing kept</h1>
    <p>{intro}</p>
    <a class="btn primary" href="/" onclick={follow('game')}>Back to the game</a>
  </section>

  <ul class="facts">
    <li class="wide" id="privacy">
      <h2>Privacy</h2>
      <ul class="points">
        <li>No accounts and no cookies. {kept} only exist while the page is open, so refreshing starts a new game.</li>
        <li>There are no adverts. Visits are counted with Cloudflare Web Analytics, which uses no cookies and does not follow you from site to site: it sees which page was opened, the browser and roughly which country, not who you are (<a href="https://www.cloudflare.com/web-analytics/" rel="noopener" target="_blank">how it works</a>).</li>
        <li>The "Support me" button shows Ko-fi's donation form, but only when you press it. Until then nothing is loaded from Ko-fi, and once you open it <a href="https://more.ko-fi.com/privacy" rel="noopener" target="_blank">Ko-fi's privacy policy</a> applies to that form.</li>
      </ul>
    </li>
    {#if fairPlay}
      <li>
        <h2>Fair play</h2>
        {@render fairPlay()}
      </li>
    {/if}
    <li>
      <h2>Sound</h2>
      <p>{recorded} are recordings from Kenney's <a href="https://kenney.nl/assets/casino-audio" rel="noopener" target="_blank">Casino Audio</a> pack, which is free for anyone to use (Creative Commons Zero). {jingles} are made by your browser as you play.</p>
      <p>Use the speaker button to mute everything. iPhones stay silent while the ringer switch is set to silent.</p>
    </li>
    <li>
      <h2>Keyboard</h2>
      {@render keyboard()}
    </li>
    <li>
      <h2>Supporting the site</h2>
      <p>The site is free and has no ads. If you enjoy it, you can buy me a coffee with the "Support me" button. Thank you!</p>
    </li>
    <li>
      <h2>Credits</h2>
      <p>The card artwork is by Byron Knoll, who released it into the public domain (<a href="https://commons.wikimedia.org/wiki/Category:Playing_cards_set_by_Byron_Knoll" rel="noopener" target="_blank">Wikimedia Commons</a>). Thank you!</p>
    </li>
    <li class="wide">
      <h2>Made by</h2>
      <p>Matt McQueen, who also writes the <a href="https://www.matt-rarely-writes.co.uk/" rel="noopener" target="_blank">Matt Rarely Writes</a> blog. The code is open source under the MIT licence on <a href="https://github.com/MattMcQueen/card-games/tree/main/apps/{folder}" rel="noopener" target="_blank">GitHub</a>. This is version {build}.</p>
    </li>
  </ul>
</div>
