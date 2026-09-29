<script lang="ts">
  import { MAX_BET, MAX_HANDS, MIN_BET, RESHUFFLE_AT, STARTING_CHIPS } from '../engine';
  import Dialog from './Dialog.svelte';

  let help: Dialog;
  let about: Dialog;

  export function showHelp() {
    help.show();
  }
  export function showAbout() {
    about.show();
  }
</script>

<Dialog bind:this={help} title="How to play">
  <p>Beat the dealer by getting a hand closer to 21 than theirs, without going over.</p>
  <h3>Card values</h3>
  <p>Number cards are worth their number, J, Q and K are worth 10, and an ace is worth 1 or 11, whichever suits the hand better.</p>
  <h3>A round</h3>
  <ul>
    <li>You start with {STARTING_CHIPS} chips and bet {MIN_BET} to {MAX_BET} chips a hand.</li>
    <li>You get two cards and the dealer gets one. The dealer's other cards come after you have finished.</li>
    <li>Blackjack (an ace and a 10-value card) pays 3 to 2. If the dealer also gets blackjack, it is a push.</li>
    <li>Beat the dealer and you win the same as your bet. A tie is a push and your bet comes back.</li>
    <li>The dealer must hit until reaching 17 or more, and always stands on 17, even a soft 17.</li>
    <li>If you run out of chips the game is over, and you can start again with {STARTING_CHIPS}.</li>
  </ul>
  <h3>Your options</h3>
  <ul>
    <li><strong>Hit (H):</strong> take another card.</li>
    <li><strong>Stand (S):</strong> keep your hand.</li>
    <li><strong>Double (D):</strong> double your bet and take exactly one more card. You need enough chips to cover it.</li>
    <li><strong>Split (P):</strong> with two cards of the same rank (a K and a Q don't count), split them into two hands with a second equal bet. You can split up to {MAX_HANDS} hands, and double down on any split hand. Split aces get one card each, and can't be split again or doubled. A two-card 21 after a split still counts as blackjack.</li>
  </ul>
  <p>There is no insurance and no surrender.</p>
  <h3>The cards</h3>
  <p>The dealer uses six decks. The shoe is reshuffled before a hand once {RESHUFFLE_AT} or fewer cards are left.</p>
</Dialog>

<Dialog bind:this={about} title="About and privacy">
  <p>This is a free game of blackjack against the dealer, just for fun. There is no real money: chips have no value, and this is not a gambling site.</p>
  <h3>Privacy</h3>
  <ul>
    <li>No accounts, no cookies, and nothing about you is stored or sent anywhere. Your chips only exist while the page is open, so refreshing starts a new game.</li>
    <li>There are no adverts and no analytics.</li>
    <li>The "Support me" button shows Ko-fi's donation form, but only when you press it. Until then nothing is loaded from Ko-fi, and once you open it <a href="https://more.ko-fi.com/privacy" rel="noopener" target="_blank">Ko-fi's privacy policy</a> applies to that form.</li>
  </ul>
  <h3>Sound</h3>
  <p>All the sounds are made by your browser as you play, not played from recordings. Use the speaker button to mute them. iPhones stay silent while the ringer switch is set to silent.</p>
  <h3>Keyboard</h3>
  <p>H to hit, S to stand, D to double and P to split.</p>
  <h3>Supporting the site</h3>
  <p>The site is free and has no ads. If you enjoy it, you can buy me a coffee with the "Support me" button. Thank you!</p>
  <h3>Made by</h3>
  <p>Matt McQueen. The code is open source under the MIT licence on <a href="https://github.com/MattMcQueen/blackjack" rel="noopener" target="_blank">GitHub</a>.</p>
</Dialog>

<style>
  h3 {
    margin: 1rem 0 0.25rem;
    font-size: 1rem;
  }
  p,
  ul {
    margin: 0.4rem 0;
  }
  ul {
    padding-left: 1.2rem;
  }
  li {
    margin: 0.25rem 0;
  }
  a {
    color: var(--ink);
  }
</style>
