<script lang="ts">
  import AboutPage from '@card-games/card-kit/AboutPage.svelte';
</script>

<AboutPage
  intro="This is a free game of two-player Cribbage against a computer opponent, to 121 on a pegging board. There is no money involved, and no sign-up."
  kept="Your scores"
  recorded="The card sounds"
  jingles="The jingles and the pegs"
  folder="cribbage"
>
  {#snippet fairPlay()}
    <p>The deck is shuffled in your browser with its cryptographic random number generator, and every hand uses a fresh, full deck. Ruth plays by the same rules as you and never sees your cards or the crib before they are shown. Every hand is counted for both of you automatically, so no points are ever missed.</p>
  {/snippet}
  {#snippet keyboard()}
    <p>Everything is a button: <kbd>Tab</kbd> moves between them and <kbd>Enter</kbd> or <kbd>Space</kbd> presses one, to choose a card for the crib, to play a card or to say go.</p>
  {/snippet}
</AboutPage>
