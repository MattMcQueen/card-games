<script lang="ts">
  import AboutPage from '@card-games/card-kit/AboutPage.svelte';
</script>

<AboutPage
  intro="This is a free game of blackjack against the dealer. There is no real money: chips have no value, and this is not a gambling site."
  kept="Your chips"
  recorded="The card and chip sounds"
  jingles="The win, lose and blackjack jingles"
  folder="blackjack"
>
  {#snippet keyboard()}
    <p><kbd>H</kbd> to hit, <kbd>S</kbd> to stand, <kbd>D</kbd> to double, <kbd>P</kbd> to split and <kbd>R</kbd> to surrender. When insurance is offered, <kbd>I</kbd> takes it and <kbd>N</kbd> declines.</p>
  {/snippet}
</AboutPage>
