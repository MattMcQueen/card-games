<script lang="ts">
  import HowToPlayPage from '@card-games/card-kit/HowToPlayPage.svelte';
  import {
    DOUBLED_OVERTRICK,
    FIVE_HONOURS,
    FOUR_ACES,
    FOUR_HONOURS,
    GAME_POINTS,
    GRAND_SLAM,
    INSULT,
    MAJOR_TRICK,
    MINOR_TRICK,
    NO_TRUMP_FIRST,
    NO_TRUMP_TRICK,
    RUBBER_BONUS_TWO_NIL,
    RUBBER_BONUS_TWO_ONE,
    SMALL_SLAM,
    UNDERTRICK,
  } from '../engine';
</script>

<HowToPlayPage title="Bid a contract, then make it" intro="Rubber bridge for four, in two partnerships: you and Helen, across the table, against Arjun and Mei. An auction decides how many tricks one side must take and which suit is trumps; then the cards are played. The first side to win two games wins the rubber.">
  <li>
    <h2>Partners and the deal</h2>
    <p>A standard 52-card deck is shuffled and everyone is dealt thirteen cards, one at a time. Aces are high. Arjun sits on your left, Helen across from you and Mei on your right. Calls and cards go round to the left, and the deal moves one seat to the left each hand.</p>
  </li>
  <li>
    <h2>The auction</h2>
    <p>The dealer calls first. A <strong>bid</strong> is a number of tricks over six, from 1 to 7, and a trump suit or <strong>no trumps</strong> (NT): 4♠ is a bid to take ten tricks with spades as trumps. Each bid must be higher than the last: more tricks, or the same number in a higher suit. From lowest to highest: ♣ clubs, ♦ diamonds, ♥ hearts, ♠ spades, then no trumps.</p>
  </li>
  <li class="wide">
    <h2>Calls</h2>
    <ul class="points">
      <li>Instead of bidding you may <strong>pass</strong>, <strong>double</strong> the other side's last bid (raising the stakes if they play it), or <strong>redouble</strong> their double of your side's bid.</li>
      <li>When a bid is followed by three passes, it is the <strong>contract</strong>. If all four pass at the start, the cards are dealt again by the next dealer.</li>
      <li>Pick a level from 1 to 7, then a suit or NT; or press Pass, Double or Redouble. The call a computer player would make with your cards has a gold ring, and the whole auction is shown under the table.</li>
    </ul>
  </li>
  <li>
    <h2>Declarer and dummy</h2>
    <p>Of the side that won the contract, the player who first bid its suit (or no trumps) is the <strong>declarer</strong>, and their partner is the <strong>dummy</strong>. The player on the declarer's left leads to the first trick; then the dummy's cards are laid face up, and the declarer plays both hands. When you declare, you play Helen's cards too; when Helen declares, she plays yours.</p>
  </li>
  <li>
    <h2>Tricks</h2>
    <p>Each player plays one card in turn, and must follow the suit led if they can; if not, any card will do. The highest trump wins the trick, or with no trump the highest card of the suit led. The winner leads the next. Each name plate shows the tricks its side has taken against the number it needs: the declarer's side its contract, the defenders enough to beat it.</p>
  </li>
  <li class="wide">
    <h2>Scoring</h2>
    <ul class="points">
      <li><strong>Below the line</strong>, for each trick bid and made over six: {MINOR_TRICK} in clubs or diamonds, {MAJOR_TRICK} in hearts or spades, and at no trumps {NO_TRUMP_FIRST} for the first and {NO_TRUMP_TRICK} for each after it. Doubled, twice as much; redoubled, four times.</li>
      <li><strong>A game</strong> is {GAME_POINTS} points below the line, in one hand or several. Then both sides start the next game from nothing. A side that has won a game is <strong>vulnerable</strong>: its bonuses and penalties are bigger.</li>
      <li><strong>Above the line</strong>, everything else. Overtricks score their trick value, or doubled {DOUBLED_OVERTRICK[0]} each ({DOUBLED_OVERTRICK[1]} vulnerable), twice that redoubled. Making a doubled contract scores {INSULT[1]}, and a redoubled one {INSULT[2]}.</li>
      <li><strong>Slams:</strong> bid and make twelve tricks for {SMALL_SLAM[0]} ({SMALL_SLAM[1]} vulnerable), all thirteen for {GRAND_SLAM[0]} ({GRAND_SLAM[1]} vulnerable).</li>
      <li><strong>Going down:</strong> the defenders score {UNDERTRICK[0]} for each trick short ({UNDERTRICK[1]} vulnerable). Doubled, not vulnerable: 100 for the first, 200 for the second and third, 300 for each after; vulnerable: 200 for the first and 300 for each after. Redoubled, twice as much.</li>
      <li><strong>Honours:</strong> holding four of the trumps' ace, king, queen, jack and ten in one hand scores {FOUR_HONOURS}, all five {FIVE_HONOURS}; all four aces at no trumps, {FOUR_ACES}. They count for whichever side held them.</li>
      <li><strong>The rubber:</strong> {RUBBER_BONUS_TWO_NIL} for winning it two games to none, {RUBBER_BONUS_TWO_ONE} for two games to one. The side with more points in all wins.</li>
    </ul>
  </li>
  <li class="wide">
    <h2>How Helen bids</h2>
    <ul class="points">
      <li>Count your <strong>points</strong>: ace 4, king 3, queen 2, jack 1, and a point for each card over four in a suit. Between the two hands, about 25 is enough for a game (3NT, 4♥ or 4♠), and 33 for a small slam.</li>
      <li><strong>Openings:</strong> 1NT shows 15 to 17 with no short suit, 2NT 20 or 21, and 2♣ 22 or more (it says nothing about clubs). With 12 or more, open one of your five-card major, or else of your longer minor. 2♦, 2♥ and 2♠ show a six-card suit and only 5 to 10 points; a bid at the three level shows a seven-card suit.</li>
      <li><strong>Answering one of a suit:</strong> pass with less than 6; raise a major with three cards or more (to 2 with 6 to 9, to 3 with 10 to 12, to game with 13 or more); bid a new four-card suit at the one level, or a five-card suit at the two level with 11 or more; or bid 1NT with 6 to 10.</li>
      <li><strong>Against an opening:</strong> bid a good five-card suit (8 to 16 points), 1NT with 15 to 18, or double with 12 or more and short in their suit, which asks partner to pick one of the others.</li>
      <li>After that, add up what the two of you have, look for eight trumps between you (hearts or spades first), and bid to the level your points are worth. A new suit asks partner to bid again.</li>
    </ul>
  </li>
  <li class="wide">
    <h2>The computer players</h2>
    <p>Helen, your partner, plays carefully and bids as above; Arjun and Mei bid the same way and are now and then a little careless. As declarer they draw trumps, set up their long suits and take their winners; in defence they lead from their partner's suit or the top of a sequence, play second hand low and third hand high. They cannot see anyone else's cards, apart from the dummy.</p>
  </li>
</HowToPlayPage>
