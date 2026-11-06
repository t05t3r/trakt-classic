<script lang="ts">
  import type { Snippet } from 'svelte';

  const { struck, children }: { struck: boolean; children: Snippet } = $props();
</script>

<span class="trakt-struck-glyph" class:is-struck={struck}>
  {@render children()}
  <span class="glyph-strike"></span>
</span>

<style lang="scss">
  .trakt-struck-glyph {
    position: relative;
    display: inline-flex;

    .glyph-strike {
      position: absolute;
      inset-block-start: 45%;
      inset-inline-start: var(--ni-0);
      width: 100%;
      height: var(--ni-1);
      background: var(--color-accent);
      opacity: 0;
      transform: rotate(-45deg);
      transition: opacity var(--transition-default);
    }

    &.is-struck .glyph-strike {
      opacity: 1;
    }
  }
</style>
