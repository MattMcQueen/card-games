<script lang="ts">
  import type { Denomination } from './chips';

  let { value }: { value: Denomination } = $props();

  const looks: Record<Denomination, { base: string; edge: string; ink: string }> = {
    1: { base: '#eeeeee', edge: '#3a6ea5', ink: '#222222' },
    5: { base: '#c62828', edge: '#ffffff', ink: '#ffffff' },
    10: { base: '#1f5fbf', edge: '#ffffff', ink: '#ffffff' },
    20: { base: '#1e1e1e', edge: '#d9b44a', ink: '#f1d27a' },
    25: { base: '#1d7a46', edge: '#ffffff', ink: '#ffffff' },
    100: { base: '#1e1e1e', edge: '#d9b44a', ink: '#f1d27a' },
    500: { base: '#5b2a86', edge: '#f1d27a', ink: '#f6e9b8' },
  };
  const look = $derived(looks[value]);
</script>

<svg class="chip" viewBox="0 0 64 64" aria-hidden="true">
  <circle cx="32" cy="32" r="30" fill={look.base} />
  <circle cx="32" cy="32" r="27" fill="none" stroke={look.edge} stroke-width="7" stroke-dasharray="7.07 7.07" />
  <circle cx="32" cy="32" r="30" fill="none" stroke="rgb(0 0 0 / 0.35)" stroke-width="1.5" />
  <circle cx="32" cy="32" r="19" fill={look.base} stroke={look.edge} stroke-width="1.5" />
  <text x="32" y={value >= 100 ? 37.5 : 38.5} text-anchor="middle" font-size={value >= 100 ? 15 : 19} font-weight="800" font-family="system-ui, sans-serif" fill={look.ink}>{value}</text>
</svg>

<style>
  .chip {
    display: block;
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 1.5px 1.5px rgb(0 0 0 / 0.5));
  }
</style>
