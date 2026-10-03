<script lang="ts">
  import AboutPage from '@card-games/card-kit/AboutPage.svelte';
</script>

<AboutPage
  intro="This is a free Texas Hold'em tournament against five computer players: the last one with chips wins. There is no real money: chips have no value, and this is not a gambling site."
  kept="Your chips"
  recorded="The card and chip sounds"
  jingles="The win and lose jingles"
  folder="poker"
>
  {#snippet fairPlay()}
    <p>The deck is shuffled in your browser with its cryptographic random number generator, and every hand uses a fresh, full deck. The computer players are played by the same rules as you and never see your cards or the cards still in the deck. They go out when they run out of chips, just as you do.</p>
  {/snippet}
  {#snippet keyboard()}
    <p>On your turn: <kbd>F</kbd> to fold, <kbd>C</kbd> to check or call, <kbd>R</kbd> to bet or raise the amount shown, and <kbd>A</kbd> to go all-in.</p>
  {/snippet}
</AboutPage>
