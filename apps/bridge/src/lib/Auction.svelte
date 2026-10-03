<script lang="ts">
  import { PLAYERS, type GameState } from '../engine';
  import { callText, callWords } from './labels';

  /** The auction so far, in four columns: on your left, your partner, on your right, and you, starting with the dealer. */
  let { game }: { game: GameState } = $props();

  const COLUMNS = [1, 2, 3, 0];
  const column = (seat: number) => COLUMNS.indexOf(seat);
  /** The calls in rows of four, with empty places before the dealer's first call. */
  const rows = $derived.by(() => {
    const cells = [...Array<null>(column(game.dealer)).fill(null), ...game.auction];
    return Array.from({ length: Math.ceil(cells.length / PLAYERS) }, (_, r) => cells.slice(r * PLAYERS, r * PLAYERS + PLAYERS));
  });
</script>

<table class="auction">
  <caption class="sr-only">The auction</caption>
  <thead>
    <tr>
      {#each COLUMNS as seat (seat)}
        <th scope="col">{game.players[seat]!.name}</th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each rows as row, r (r)}
      <tr>
        {#each { length: PLAYERS } as _, c (c)}
          {@const turn = row[c]}
          <td class:red={turn?.call.kind === 'bid' && (turn.call.strain === 'H' || turn.call.strain === 'D')}>
            {#if turn}<span aria-hidden="true">{callText(turn.call)}</span><span class="sr-only">{callWords(turn.call)}</span>{/if}
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .auction {
    border-collapse: collapse;
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
  }
  th,
  td {
    min-width: 4.2rem;
    padding: 0.15rem 0.4rem;
    text-align: center;
  }
  th {
    border-bottom: 1px solid var(--line);
    color: var(--muted);
    font-weight: 700;
  }
  td {
    font-weight: 700;
  }
  .red {
    color: light-dark(#c0392b, #ff8a7a);
  }
</style>
