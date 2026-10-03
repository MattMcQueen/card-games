<script lang="ts">
  /**
   * The result of a hand, on the table: `main` in large type and `sub` under it, in the colours of good news
   * for you (`win`) or bad (`lose`).
   */
  let { tone, main, sub = '' }: { tone: 'win' | 'lose'; main: string; sub?: string } = $props();
</script>

<div class="verdict {tone}" role="status">
  <strong>{main}</strong>
  {#if sub}<span>{sub}</span>{/if}
</div>

<style>
  .verdict {
    display: grid;
    justify-items: center;
    padding: 0.3rem 1.2rem;
    border-radius: 1rem;
    text-align: center;
    animation: pop 0.4s cubic-bezier(0.2, 1.4, 0.4, 1) both;
  }
  .verdict strong {
    font: 400 clamp(1.1rem, 4.4cqw, 1.6rem) / 1.2 var(--serif);
  }
  .verdict span {
    font-size: 0.8rem;
    font-weight: 600;
  }
  .win {
    background: var(--win-bg);
    color: var(--win-fg);
  }
  .lose {
    background: var(--lose-bg);
    color: var(--lose-fg);
  }
  /* On a narrow table (a phone) it is smaller, and wraps into balanced lines. */
  @container (max-width: 600px) {
    .verdict {
      padding: 0.25rem 0.6rem;
      text-wrap: balance;
    }
    .verdict strong {
      font-size: 1rem;
    }
    .verdict span {
      font-size: 0.7rem;
    }
  }
  @keyframes pop {
    from {
      transform: scale(0.6);
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .verdict {
      animation: none;
    }
  }
</style>
