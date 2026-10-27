<script lang="ts">
  import type { Snippet } from 'svelte';

  const { children }: { children: Snippet } = $props();
</script>

<span class="trakt-pill">{@render children()}</span>

<style lang="scss">
  .trakt-pill {
    padding: var(--ni-1) var(--ni-4);
    border-radius: var(--border-radius-xxs);
    background-color: var(--color-tag-generic);
    color: var(--color-text-primary);
    font-family: var(--font-family-heading);
    font-size: var(--font-size-label);
    font-weight: var(--font-weight-heading);
    text-transform: uppercase;
  }
</style>
