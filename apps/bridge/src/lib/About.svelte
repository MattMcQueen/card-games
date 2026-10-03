<script lang="ts">
  import AboutPage from '@card-games/card-kit/AboutPage.svelte';
</script>

<AboutPage
  intro="This is a free game of rubber bridge: you and a computer partner against two computer players. There is no money involved, and no sign-up."
  kept="Your scores"
  recorded="The card sounds"
  jingles="The jingles"
  folder="bridge"
>
  {#snippet fairPlay()}
    <p>The deck is shuffled in your browser with its cryptographic random number generator, and every hand uses a fresh, full deck. The computer players, your partner included, play by the same rules as you. They see only their own cards, the dummy once it is face up, the auction and the cards played, never your hand or each other's.</p>
  {/snippet}
  {#snippet keyboard()}
    <p>Everything is a button: <kbd>Tab</kbd> moves between them and <kbd>Enter</kbd> or <kbd>Space</kbd> presses one, to make a call or to play a card from your hand or the dummy.</p>
  {/snippet}
</AboutPage>
