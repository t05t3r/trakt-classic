<script lang="ts">
  import type { Snippet } from 'svelte';

  const {
    color = 'accent',
    children,
  }: { color?: 'accent' | 'list'; children: Snippet } = $props();
</script>

<span class="trakt-caption-tag" data-color={color}>{@render children()}</span>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-caption-tag {
    @include caption-tag-box;

    &[data-color='accent'] {
      background-color: var(--color-accent);
    }

    &[data-color='list'] {
      background-color: var(--color-action-list);
    }
  }
</style>
