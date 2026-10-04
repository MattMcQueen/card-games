<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * You, along the bottom of a game's table (the felt): your name `plate` to the left of your cards (`children`),
   * which take the width between it and a space as wide on the right. On a narrow table (a phone) the plate goes
   * above your cards, or `beside` them if there are few enough to fit.
   */
  let { plate, children, beside = false }: { plate: Snippet; children: Snippet; beside?: boolean } = $props();
</script>

<div class="bottom" class:beside>
  <div class="plate">{@render plate()}</div>
  {@render children()}
</div>

<style>
  .bottom {
    position: absolute;
    left: 1rem;
    right: 1rem;
    bottom: 0.9rem;
    display: grid;
    grid-template-columns: var(--plate-w) minmax(0, 1fr) var(--plate-w);
    align-items: end;
    gap: 1rem;
  }
  .plate {
    display: grid;
    justify-items: center;
    --plate-w: 7.5rem;
    --plate-name: 0.95rem;
    --plate-stack: 1.15rem;
  }

  @container (max-width: 600px) {
    .bottom {
      left: 0.5rem;
      right: 0.5rem;
      bottom: 0.6rem;
      grid-template-columns: minmax(0, 1fr);
      gap: 0.2rem;
    }
    .bottom.beside {
      grid-template-columns: var(--plate-w) minmax(0, 1fr);
      gap: 0.5rem;
    }
    .plate {
      justify-self: start;
      --plate-w: 6rem;
      --plate-name: 0.8rem;
      --plate-stack: 0.95rem;
    }
  }
</style>
