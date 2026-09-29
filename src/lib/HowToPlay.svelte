<script lang="ts">
  import { MAX_BET, MAX_HANDS, MIN_BET, RESHUFFLE_AT, STARTING_CHIPS } from '../engine';
  import { follow } from './router.svelte';
</script>

<div class="page">
  <section class="hero">
    <span class="kicker">How to play</span>
    <h1>Get closer to 21 than the dealer</h1>
    <p>Beat the dealer by getting a hand closer to 21 than theirs, without going over.</p>
    <a class="btn primary" href="/" onclick={follow('game')}>Back to the game</a>
  </section>

  <ul class="facts">
    <li>
      <h2>Card values</h2>
      <p>Number cards are worth their number, J, Q and K are worth 10, and an ace is worth 1 or 11, whichever suits the hand better.</p>
    </li>
    <li>
      <h2>The cards</h2>
      <p>The dealer uses six decks. The shoe is reshuffled before a hand once {RESHUFFLE_AT} or fewer cards are left.</p>
    </li>
    <li class="wide">
      <h2>A round</h2>
      <ul class="points">
        <li>You start with {STARTING_CHIPS} chips and bet {MIN_BET} to {MAX_BET} chips a hand.</li>
        <li>You get two cards and the dealer gets one. The dealer's other cards come after you have finished.</li>
        <li>Blackjack (an ace and a 10-value card) pays 3 to 2. If the dealer also gets blackjack, it is a push.</li>
        <li>Beat the dealer and you win the same as your bet. A tie is a push and your bet comes back.</li>
        <li>The dealer must hit until reaching 17 or more, and always stands on 17, even a soft 17.</li>
        <li>If you run out of chips the game is over, and you can start again with {STARTING_CHIPS}.</li>
      </ul>
    </li>
    <li class="wide">
      <h2>Your options</h2>
      <ul class="points">
        <li><strong>Hit <kbd>H</kbd>:</strong> take another card.</li>
        <li><strong>Stand <kbd>S</kbd>:</strong> keep your hand.</li>
        <li><strong>Double <kbd>D</kbd>:</strong> double your bet and take exactly one more card. You need enough chips to cover it.</li>
        <li><strong>Surrender <kbd>R</kbd>:</strong> on your first two cards, give up the hand and get half your bet back (rounded down). You can't surrender after a split or after taking another action, and a bet of 1 chip is too small to surrender.</li>
        <li><strong>Split <kbd>P</kbd>:</strong> with two cards of the same rank (a K and a Q don't count), split them into two hands with a second equal bet. You can split up to {MAX_HANDS} hands, and double down on any split hand. Split aces get one card each, and can't be split again or doubled. A two-card 21 after a split still counts as blackjack.</li>
      </ul>
      <p>The dealer has no hidden card, so you always choose before you know whether they have blackjack. That includes surrendering.</p>
    </li>
    <li class="wide">
      <h2>Insurance</h2>
      <p>When the dealer's first card is an ace, you are offered insurance before you play: a side bet of half your bet (rounded down) that the dealer's next card makes blackjack.</p>
      <ul class="points">
        <li>It pays 2 to 1 if the dealer gets blackjack, and the stake is lost if not. It doesn't affect your hand's own bet.</li>
        <li>Press <kbd>I</kbd> to take it or <kbd>N</kbd> to say no thanks.</li>
        <li>A bet of 1 chip can't be insured, and you need enough chips left to cover the stake.</li>
        <li>It is settled when the dealer draws their second card. If you take insurance the dealer always draws it, even if you have gone bust or surrendered.</li>
        <li>If you have blackjack you are still offered it. Taking it locks in a win of about your bet (known as even money): it pays 2 to 1 if the dealer has blackjack, and your blackjack pays 3 to 2 if not.</li>
      </ul>
    </li>
  </ul>
</div>
