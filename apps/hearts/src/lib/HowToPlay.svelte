<script lang="ts">
  import { follow } from '@card-games/card-kit/router.svelte';
  import { GAME_OVER_SCORE, PASS_SIZE } from '../engine';
</script>

<div class="page">
  <section class="hero">
    <span class="kicker">How to play</span>
    <h1>Take as few points as you can</h1>
    <p>Hearts for four: you and three computer players. Every heart you take costs a point and the queen of spades costs thirteen. When someone reaches {GAME_OVER_SCORE}, the lowest score wins.</p>
    <a class="btn primary" href="/" onclick={follow('game')}>Back to the game</a>
  </section>

  <ul class="facts">
    <li>
      <h2>The deal</h2>
      <p>A standard 52-card deck is shuffled and everyone is dealt thirteen cards. Aces are high. Terry sits on your left, Margaret across from you and Priya on your right, and play goes round to the left (clockwise).</p>
    </li>
    <li>
      <h2>Passing</h2>
      <p>Before each hand, everyone chooses {PASS_SIZE} cards to pass on: to the left in the first hand, to the right in the second, across in the third, and nobody passes in the fourth. Then it starts again. Tap three cards, then <strong>Pass</strong>. The cards you are passed have a gold edge until the first trick is over.</p>
    </li>
    <li class="wide">
      <h2>Tricks</h2>
      <ul class="points">
        <li>Whoever holds the <strong>two of clubs</strong> leads it to the first trick.</li>
        <li>Everyone plays one card in turn. You must <strong>follow suit</strong> (play a card of the suit that was led) if you can. If you cannot, you may play any card.</li>
        <li>The highest card of the suit led wins the trick, whatever else was played. There are no trumps. The winner leads the next trick.</li>
        <li><strong>No points on the first trick:</strong> nobody may play a heart or the queen of spades on it, unless they have nothing else.</li>
        <li><strong>Breaking hearts:</strong> hearts may not be led until a heart has been played on an earlier trick (because someone had no cards of the suit led). A player who has nothing but hearts may lead one.</li>
        <li>On your turn the cards you may play are bright and the others are darkened. Tap one to play it.</li>
      </ul>
    </li>
    <li>
      <h2>Scoring</h2>
      <ul class="points">
        <li>Each heart in the tricks you take: <strong>1 point</strong>.</li>
        <li>The queen of spades: <strong>13 points</strong>.</li>
        <li>Everything else: nothing. That is 26 points in every hand.</li>
      </ul>
    </li>
    <li>
      <h2>Shooting the moon</h2>
      <p>Take <strong>every</strong> heart and the queen of spades in one hand and you score nothing, while everyone else scores 26. It is risky: miss even one heart and you keep all the points you took.</p>
    </li>
    <li class="wide">
      <h2>Winning</h2>
      <p>Points add up from hand to hand. When a hand ends with anyone on {GAME_OVER_SCORE} or more, the game is over and the player with the <strong>lowest</strong> score wins. Players who tie for the lowest share the win. The score sheet under the table shows every hand.</p>
    </li>
    <li class="wide">
      <h2>Tips</h2>
      <ul class="points">
        <li>Pass the queen of spades, and the ace and king of spades, unless you hold plenty of low spades to protect them.</li>
        <li>Passing all of a short suit lets you throw away hearts or the queen when that suit is led.</li>
        <li>Play high cards early, when the tricks have no points in them, and keep low cards to lose tricks later.</li>
      </ul>
    </li>
    <li class="wide">
      <h2>Your opponents</h2>
      <p>Each computer player has its own level of skill. Terry is a beginner who often plays carelessly. Margaret is steady. Priya is the toughest, and will spend a few points to stop you shooting the moon. They cannot see your cards, and they play by the same rules as you.</p>
    </li>
  </ul>
</div>
