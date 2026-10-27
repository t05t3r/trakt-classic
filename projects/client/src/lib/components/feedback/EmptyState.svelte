<script lang="ts">
  import type { Snippet } from 'svelte';

  const { children }: { children: Snippet } = $props();
</script>

<div class="trakt-empty-state">
  {@render children()}
</div>

<style lang="scss">
  .trakt-empty-state {
    box-sizing: border-box;
    width: 100%;
    margin: var(--ni-0);
    padding: var(--ni-15);
    border: var(--border-thickness-xxs) solid transparent;
    background: var(--color-surface-menu);
    color: var(--color-text-tertiary);
    font-family: var(--font-family-body);
    font-size: var(--font-size-text);
    font-style: italic;
    line-height: var(--line-height-text);
  }
</style>
