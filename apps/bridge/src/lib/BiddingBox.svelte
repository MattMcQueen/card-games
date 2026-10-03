<script lang="ts">
  import { untrack } from 'svelte';
  import { DOUBLE, MAX_LEVEL, PASS, REDOUBLE, STRAINS, bid, isLegalCall, sameCall, type Call, type GameState } from '../engine';
  import { SYMBOLS, callText, callWords } from './labels';

  /** Your call: pick a level, then a strain, or pass, double or redouble. `suggestion` is marked, and its level picked to start. */
  let { game, suggestion, oncall }: { game: GameState; suggestion: Call; oncall: (call: Call) => void } = $props();

  const levels = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);
  const open = (n: number) => STRAINS.some((s) => isLegalCall(game, bid(n, s)));
  let level = $state(untrack(() => (suggestion.kind === 'bid' ? suggestion.level : (levels.find(open) ?? 1))));
  const others: Call[] = [PASS, DOUBLE, REDOUBLE];
  /** Short names for a narrow screen. */
  const SHORT: Record<string, string> = { pass: 'Pass', double: 'Dbl', redouble: 'Rdbl' };
</script>

<div class="box" role="group" aria-label="Your call">
  <div class="levels" role="group" aria-label="Level">
    {#each levels as n (n)}
      <button type="button" class="btn level" aria-pressed={level === n} disabled={!open(n)} onclick={() => (level = n)}>{n}</button>
    {/each}
  </div>
  <div class="calls">
    {#each STRAINS as s (s)}
      {@const call = bid(level, s)}
      <button
        type="button"
        class="btn call"
        class:red={s === 'H' || s === 'D'}
        class:hint={sameCall(call, suggestion)}
        disabled={!isLegalCall(game, call)}
        aria-label="Bid {callWords(call)}"
        onclick={() => oncall(call)}>{level}{SYMBOLS[s]}</button
      >
    {/each}
    {#each others as call (call.kind)}
      <button type="button" class="btn call word" class:hint={sameCall(call, suggestion)} disabled={!isLegalCall(game, call)} aria-label={callText(call)} onclick={() => oncall(call)}><span class="long">{callText(call)}</span><span class="short" aria-hidden="true">{SHORT[call.kind]}</span></button>
    {/each}
  </div>
  <p class="suggested">Suggested: <strong>{callText(suggestion)}</strong></p>
</div>

<style>
  .box {
    display: grid;
    justify-items: center;
    gap: 0.45rem;
    width: 100%;
  }
  .levels,
  .calls {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.35rem;
  }
  .btn {
    min-width: 2.75rem;
    min-height: 2.6rem;
    padding: 0.2rem 0.55rem;
    font-variant-numeric: tabular-nums;
  }
  .level[aria-pressed='true'] {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--accent);
  }
  .call {
    min-width: 3.2rem;
    font-weight: 800;
  }
  .word {
    min-width: 4rem;
    font-weight: 700;
  }
  .red:not(:disabled) {
    color: light-dark(#c0392b, #ff8a7a);
  }
  /* The suggested call: a ring the colour of the active hand. */
  .hint:not(:disabled) {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--highlight) 70%, transparent);
  }
  .suggested {
    margin: 0;
    font-size: 0.8rem;
    color: var(--muted);
  }
  .short {
    display: none;
  }
  /* A phone: every call on one row under the levels, and the suggestion shown only by its ring. */
  @media (max-width: 480px) {
    .box {
      gap: 0.2rem;
    }
    .levels,
    .calls {
      flex-wrap: nowrap;
      gap: 0.25rem;
    }
    .btn,
    .call,
    .word {
      min-width: 2.35rem;
      min-height: 2.1rem;
      padding: 0.1rem 0.3rem;
      font-size: 0.85rem;
    }
    .long {
      display: none;
    }
    .short {
      display: inline;
    }
    .suggested {
      display: none;
    }
  }
</style>
