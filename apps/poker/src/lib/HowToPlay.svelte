<script lang="ts">
  import { follow } from '@card-games/card-kit/router.svelte';
  import { BIG_BLIND, SEATS, SMALL_BLIND, STARTING_STACK } from '../engine';

  // The hands from best to worst, with an example of each. Suits are written as letters to keep the page plain.
  const hands = [
    { name: 'Royal flush', example: 'A K Q J 10 of one suit', note: 'The best straight flush.' },
    { name: 'Straight flush', example: '9 8 7 6 5 of one suit', note: 'Five in a row, all the same suit.' },
    { name: 'Four of a kind', example: 'Q Q Q Q 7', note: 'Four cards of the same rank.' },
    { name: 'Full house', example: 'K K K 4 4', note: 'Three of a kind and a pair.' },
    { name: 'Flush', example: 'A J 8 5 2 of one suit', note: 'Any five cards of the same suit.' },
    { name: 'Straight', example: '10 9 8 7 6', note: 'Five in a row. The ace can be high (A K Q J 10) or low (5 4 3 2 A).' },
    { name: 'Three of a kind', example: '8 8 8 K 3', note: 'Three cards of the same rank.' },
    { name: 'Two pair', example: 'J J 5 5 A', note: 'Two different pairs.' },
    { name: 'Pair', example: '10 10 A 7 3', note: 'Two cards of the same rank.' },
    { name: 'High card', example: 'A J 8 6 2', note: 'None of the above: the highest card counts.' },
  ];
</script>

<div class="page">
  <section class="hero">
    <span class="kicker">How to play</span>
    <h1>Win the pot with the best five cards</h1>
    <p>Texas Hold'em against five computer players, played the way it is in a UK casino cardroom: no limit, with blinds and no antes.</p>
    <a class="btn primary" href="/" onclick={follow('game')}>Back to the game</a>
  </section>

  <ul class="facts">
    <li>
      <h2>The table</h2>
      <p>You and five computer players sit at a table of {SEATS}. Everyone starts with {STARTING_STACK} chips. The blinds are {SMALL_BLIND} and {BIG_BLIND} and stay the same all game.</p>
      <p>The computer players buy back in if they run out, as new players do at a real table. If you run out, the game is over and you can start again.</p>
    </li>
    <li>
      <h2>The goal</h2>
      <p>Make the best five-card hand from your two private cards and the five shared cards on the table (or make everyone else fold). The best hand at the end wins the pot.</p>
    </li>
    <li class="wide">
      <h2>A hand</h2>
      <ul class="points">
        <li>The <strong>dealer button</strong> (D) moves one seat clockwise each hand. The player to its left posts the <strong>small blind</strong> ({SMALL_BLIND}) and the next posts the <strong>big blind</strong> ({BIG_BLIND}). These forced bets start the pot.</li>
        <li>Everyone is dealt two private cards, called hole cards. You are the only one who sees yours.</li>
        <li><strong>Pre-flop:</strong> betting starts with the player left of the big blind, and goes clockwise.</li>
        <li><strong>The flop:</strong> three shared cards are dealt face up, and there is another round of betting, starting with the small blind (or the first player still in after it).</li>
        <li><strong>The turn:</strong> a fourth shared card, and another round of betting.</li>
        <li><strong>The river:</strong> the fifth and last shared card, and the final round of betting.</li>
        <li><strong>The showdown:</strong> if more than one player is left, they turn their cards over and the best hand wins. If everyone else folds, the last player wins the pot without showing their cards.</li>
      </ul>
      <p>Before each of the flop, turn and river the dealer burns (discards) the top card of the deck, as in a casino.</p>
    </li>
    <li class="wide">
      <h2>Your options</h2>
      <ul class="points">
        <li><strong>Fold <kbd>F</kbd>:</strong> give up your cards and any chips you have bet.</li>
        <li><strong>Check <kbd>C</kbd>:</strong> pass, when nobody has bet in this round. (Folding when you could check is allowed, but never a good idea.)</li>
        <li><strong>Call <kbd>C</kbd>:</strong> match the current bet. If you do not have enough chips you call for all you have, and you are all-in.</li>
        <li><strong>Bet or raise <kbd>R</kbd>:</strong> set the amount with the slider or the shortcut buttons (the smallest raise, half the pot, three quarters, the pot, or all-in) and press the button. The amount is the total you will have bet in this round, so "Raise to 60" puts your bet up to 60.</li>
        <li><strong>All-in <kbd>A</kbd>:</strong> bet every chip you have.</li>
      </ul>
    </li>
    <li class="wide">
      <h2>Betting rules</h2>
      <ul class="points">
        <li><strong>No limit:</strong> you can bet any amount, up to all of your chips, at any time.</li>
        <li><strong>Minimum bet:</strong> the big blind ({BIG_BLIND}) after the flop.</li>
        <li><strong>Minimum raise:</strong> at least as big as the last bet or raise in that round. If someone bets 20 and someone raises to 60 (a raise of 40), the next raise must be to at least 100.</li>
        <li><strong>The big blind's option:</strong> if everyone just calls before the flop, the big blind may check or raise.</li>
        <li><strong>Short all-ins:</strong> a player who goes all-in for less than a full raise does not reopen the betting: players who have already acted can only call or fold. If several short all-ins add up to a full raise, the betting is reopened.</li>
        <li><strong>Side pots:</strong> when a player is all-in for less than the others, they can only win the part of the pot they could match. The extra chips the others bet go into a side pot that the all-in player cannot win. There can be several side pots.</li>
        <li><strong>Uncalled bets:</strong> if you bet more than anyone can call, the extra chips are handed back.</li>
        <li><strong>Split pots:</strong> if two or more players have exactly equal hands they share the pot. An odd chip goes to the winner nearest the left of the dealer button.</li>
        <li><strong>Running the board:</strong> once everyone left is all-in (or only one player has chips left to bet), the remaining shared cards are dealt at once with no more betting.</li>
        <li><strong>No rake:</strong> unlike a real casino there is no house fee. Every chip bet goes to the winners.</li>
      </ul>
    </li>
    <li class="wide" id="hands">
      <h2>Hand rankings, best first</h2>
      <p>Suits are never better than each other. If two players have the same type of hand, the higher cards win, and after that the highest "kicker" (the leftover cards that are not part of the hand). The best five cards from your seven always play.</p>
      <ol class="ranks">
        {#each hands as { name, example, note } (name)}
          <li>
            <strong>{name}</strong>
            <span class="example">{example}</span>
            <span class="note">{note}</span>
          </li>
        {/each}
      </ol>
    </li>
    <li class="wide">
      <h2>Your opponents</h2>
      <p>Each computer player has its own style and its own level of skill, from easy to tough. Terry is a beginner who plays too many hands, calls too much and often misjudges a hand. Nigel bets and bluffs at almost anything, and often gets it wrong. Gary is careful but ordinary. Margaret is solid and patient. Priya is the toughest: sharp, well rounded and hard to bluff. They cannot see your cards, and they play by the same rules as you.</p>
    </li>
  </ul>
</div>

<style>
  .ranks {
    display: grid;
    gap: 0.5rem;
    margin: 0.75rem 0 0;
    padding: 0;
    list-style: none;
    counter-reset: rank;
  }
  .ranks li {
    display: grid;
    grid-template-columns: 2rem minmax(9rem, 12rem) minmax(0, 1fr);
    align-items: baseline;
    gap: 0.2rem 0.8rem;
    padding: 0.5rem 0.9rem 0.5rem 0.5rem;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--bg);
    counter-increment: rank;
  }
  .ranks li::before {
    content: counter(rank);
    display: grid;
    place-items: center;
    width: 1.7rem;
    height: 1.7rem;
    border-radius: 50%;
    background: var(--accent-soft);
    color: var(--fg);
    font-weight: 800;
    font-size: 0.85rem;
  }
  .example {
    font-weight: 600;
    color: var(--fg);
    font-variant-numeric: tabular-nums;
  }
  .note {
    grid-column: 3;
    font-size: 0.92rem;
    color: var(--soft);
  }
  @media (max-width: 640px) {
    .ranks li {
      grid-template-columns: 2rem minmax(0, 1fr);
    }
    .example,
    .note {
      grid-column: 2;
    }
  }
</style>
