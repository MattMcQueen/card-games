<script lang="ts">
  import logo from './kofi-logo.png';

  let { onclick }: { onclick: () => void } = $props();
</script>

<!-- The same "Support me" button as on Brand New: the Ko-fi logo on a terracotta pill. -->
<button type="button" class="support" {onclick} title="Support me on Ko-fi" aria-label="Support me on Ko-fi">
  <img src={logo} width="39" height="31" alt="" />
  <span>Support me</span>
</button>

<style>
  .support {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 3rem;
    padding: 0 1.25rem 0 0.9rem;
    border: 0;
    border-radius: 100px;
    background: #a84e2b;
    color: #fff;
    font: 600 1rem system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    cursor: pointer;
    box-shadow:
      0 3px 0 rgb(0 0 0 / 0.35),
      0 6px 12px rgb(0 0 0 / 0.25);
    transition: transform 0.1s, box-shadow 0.1s, filter 0.15s;
  }
  .support:hover {
    filter: brightness(1.1);
  }
  .support:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 rgb(0 0 0 / 0.35);
  }
  .support:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 3px;
  }
  img {
    width: 39px;
    height: auto;
  }
</style>
