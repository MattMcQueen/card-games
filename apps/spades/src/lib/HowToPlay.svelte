<script lang="ts">
  import HowToPlayPage from '@card-games/card-kit/HowToPlayPage.svelte';
  import { BAG_PENALTY, BAGS_LIMIT, GAME_OVER_SCORE, NIL_BONUS, POINTS_PER_TRICK } from '../engine';
</script>

<HowToPlayPage title="Bid your tricks, then take them" intro={`Spades for four, in two partnerships: you and Grace, across the table, against Omar and Lena. Say how many tricks you will take, then take at least that many. The first side to ${GAME_OVER_SCORE} points wins.`}>
  <li>
    <h2>Partners and the deal</h2>
    <p>A standard 52-card deck is shuffled and everyone is dealt thirteen cards, one at a time. Aces are high, and <strong>spades are always trumps</strong>. Omar sits on your left, Grace across from you and Lena on your right. Play goes round to the left, and the deal moves one seat to the left each hand.</p>
  </li>
  <li>
    <h2>Bidding</h2>
    <p>Starting on the dealer's left, everyone says how many tricks they expect to take, from 1 to 13, or <strong>nil</strong> (none at all). You and your partner's bids add up to your side's bid. Your bid starts at what a computer player would bid with your cards: change it with <strong>−</strong> and <strong>+</strong>, then press <strong>Bid</strong>. Each name plate shows the tricks taken so far and the bid.</p>
  </li>
  <li class="wide">
    <h2>Tricks</h2>
    <ul class="points">
      <li>The player on the dealer's left leads to the first trick, and whoever wins a trick leads to the next.</li>
      <li>Going round to the left, each player adds one card. If you hold any of the suit that was led, you must play one: that is <strong>following suit</strong>. If you hold none, any card will do, and a spade will <em>trump</em> the trick.</li>
      <li>The highest spade wins the trick. If no spade was played, the highest card of the suit led wins.</li>
      <li><strong>Breaking spades:</strong> spades may not be led until a spade has been played on an earlier trick. A player who has nothing but spades may lead one.</li>
      <li>When it is your turn, the cards you are allowed to play stay bright and the rest go dark: tap the one you want.</li>
    </ul>
  </li>
  <li>
    <h2>Scoring</h2>
    <ul class="points">
      <li><strong>Made it:</strong> {POINTS_PER_TRICK} points for each trick your side bid, and 1 point for each trick over (a <em>bag</em>).</li>
      <li><strong>Set:</strong> take fewer than you bid and you lose {POINTS_PER_TRICK} points for each trick bid.</li>
      <li><strong>Bags:</strong> every {BAGS_LIMIT} bags your side gathers costs {BAG_PENALTY} points, so do not take many more tricks than you need.</li>
    </ul>
  </li>
  <li>
    <h2>Nil</h2>
    <p>Bid nil and take no tricks at all for {NIL_BONUS} points for your side; take even one and your side loses {NIL_BONUS}. Your partner's bid is scored as usual, and any tricks you do take count towards it.</p>
  </li>
  <li class="wide">
    <h2>Winning</h2>
    <p>Points add up from hand to hand, and the corner of the table shows both sides' scores. When a hand ends with a side on {GAME_OVER_SCORE} or more, the side with the higher score wins. If both sides are level, play goes on. The score sheet under the table shows every hand.</p>
  </li>
  <li class="wide">
    <h2>Tips</h2>
    <ul class="points">
      <li>Count an ace or a guarded king as a trick, each spade over three as a trick, and a spade or two to trump a suit you are short in.</li>
      <li>When your partner is going nil, play high and take the tricks they might otherwise be stuck with.</li>
      <li>Once your side has made its bid, try to lose the rest, unless you can still set the other side.</li>
    </ul>
  </li>
  <li class="wide">
    <h2>The computer players</h2>
    <p>Grace, your partner, is a steady player who covers your nil and leaves your winning cards alone. Omar and Lena are a little more careless, but will try to set you, and to make a nil bidder take a trick. They cannot see anyone else's cards, and they play by the same rules as you.</p>
  </li>
</HowToPlayPage>
