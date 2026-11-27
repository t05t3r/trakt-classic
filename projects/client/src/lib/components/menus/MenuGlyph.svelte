<script lang="ts">
  import type { Snippet } from 'svelte';

  const { children }: { children: Snippet } = $props();
</script>

<!-- One column for a menu's trigger and its rows, so their glyphs and labels line up. -->
<span class="trakt-menu-glyph" aria-hidden="true">{@render children()}</span>

<style lang="scss">
  .trakt-menu-glyph {
    display: flex;
    flex: none;
    justify-content: center;
    width: var(--icon-size-menu-check);
    margin-inline-end: var(--ni-6);

    :global(svg) {
      width: var(--icon-size-menu-check);
      height: var(--icon-size-menu-check);
    }
  }
</style>
