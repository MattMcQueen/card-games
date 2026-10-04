<script lang="ts">
  import HowToPlayPage from '@card-games/card-kit/HowToPlayPage.svelte';
  import { GAME_POINTS, SKUNK_LINE } from '../engine';
</script>

<HowToPlayPage title="Fifteen two, fifteen four" intro={`Cribbage for two: you against Ruth. Score points by playing cards and by the cards you hold, and move your pegs round the board. The first to ${GAME_POINTS} wins, the moment they get there.`}>
  <li>
    <h2>The deal and the crib</h2>
    <p>Each of you cuts the deck, and the lower card deals the first hand (aces are low). After that the deal takes turns. Six cards each are dealt, and each of you puts two face down in the <strong>crib</strong>, an extra hand that belongs to the dealer. Tap two cards to choose them, then press <strong>Put them in the crib</strong>.</p>
  </li>
  <li>
    <h2>The starter</h2>
    <p>The next card of the deck is turned up: the <strong>starter</strong>. It counts as part of both hands and the crib. If it is a jack, the dealer pegs two <em>for his heels</em>.</p>
  </li>
  <li class="wide">
    <h2>The play</h2>
    <ul class="points">
      <li>The player who did not deal lays a card first, then you take turns, each adding to the total so far: <strong>the count</strong>. An ace counts 1, a jack, queen or king 10, and the rest their number.</li>
      <li>The count may never go over 31. If you cannot play without going over, you say <strong>go</strong>, and the other player carries on for as long as they can.</li>
      <li>Whoever plays the last card before neither of you can go on pegs one <em>for the go</em>, or two if the count is exactly 31. The count then starts again from 0, led by the other player.</li>
      <li>The very last card of the play pegs one, unless it makes 31.</li>
    </ul>
  </li>
  <li class="wide">
    <h2>Pegging in the play</h2>
    <ul class="points">
      <li><strong>Fifteen:</strong> make the count 15 for 2. <strong>Thirty-one:</strong> make it 31 for 2.</li>
      <li><strong>Pairs:</strong> play a card of the same rank as the one just played for 2; a third in a row is three of a kind for 6, and a fourth is four of a kind for 12.</li>
      <li><strong>Runs:</strong> if your card and the ones just before it make three or more ranks in a row (in any order, such as 7, 5, 6), peg a point a card.</li>
    </ul>
  </li>
  <li class="wide">
    <h2>The show</h2>
    <p>Once all the cards are played, each hand is counted with the starter: first the hand of the player who did not deal, then the dealer's hand, then the dealer's crib. As the first to {GAME_POINTS} wins at once, counting first can win the game.</p>
    <ul class="points">
      <li><strong>Fifteens:</strong> 2 for every different set of cards adding up to 15.</li>
      <li><strong>Pairs:</strong> 2 for every pair of cards of the same rank (three of a kind is three pairs, 6).</li>
      <li><strong>Runs:</strong> a point a card for three or more ranks in a row. Each different run counts, so 7, 8, 8, 9 has two runs of three. Aces are low: Q, K, A is not a run.</li>
      <li><strong>Flush:</strong> 4 if the four cards in your hand are one suit, or 5 if the starter is too. A crib only scores a flush of all five.</li>
      <li><strong>His nob:</strong> 1 for the jack of the same suit as the starter.</li>
    </ul>
    <p>The game counts every hand for you, calling it the way players do: "fifteen 2, fifteen 4, a pair is 6".</p>
  </li>
  <li>
    <h2>The board</h2>
    <p>Each of you has two pegs. Every time you score, the back peg jumps ahead of the front one by the points scored, so the gap between them shows your last score. Your pegs are yellow, along the bottom of the board; Ruth's are blue, along the top. They go out along the middle and back along the edge to the game hole.</p>
  </li>
  <li>
    <h2>Winning, and skunks</h2>
    <p>The first to {GAME_POINTS} wins, even in the middle of the play. If the loser has not passed the line after hole {SKUNK_LINE - 1}, three quarters of the way round, they are <strong>skunked</strong>. Nobody needs to call muggins here: every point is counted for both of you.</p>
  </li>
  <li class="wide">
    <h2>Tips</h2>
    <ul class="points">
      <li>Keep cards that make fifteens and runs together, and fives, which make fifteen with any ten-card.</li>
      <li>Give good cards, such as fives and pairs, to your own crib, and keep them out of Ruth's.</li>
      <li>Lead a card under five, so the reply cannot make fifteen, and avoid leaving the count at 5 or 21.</li>
    </ul>
  </li>
  <li class="wide">
    <h2>Ruth</h2>
    <p>Ruth chooses her discard by working out, for every pair she could put in the crib, what the four cards left would score on average over every starter that could be cut, and whether the pair would help her own crib or yours. In the play she takes the points she can and tries not to leave you an easy fifteen, thirty-one, pair or run. Now and then she plays a careless card. She cannot see your cards, the crib or the starter until they are turned up.</p>
  </li>
</HowToPlayPage>
