<script lang="ts" generics="T">
  import type { PosterStackProps } from './PosterStackProps.ts';

  const MAX_POSTERS = 5;

  const { items, key, poster }: PosterStackProps<T> = $props();

  const shown = $derived(items.slice(0, MAX_POSTERS));
</script>

<div class="trakt-poster-stack">
  {#each shown as entry (key(entry))}
    <div class="poster-stack-item">
      <div class="poster-stack-poster">
        {@render poster(entry)}
      </div>
    </div>
  {/each}
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  // The first poster sits at the inline end; the last one drawn shows whole.
  .trakt-poster-stack {
    display: flex;
    flex-direction: row-reverse;
    width: var(--poster-stack-width);
    height: var(--poster-stack-height);
    overflow: hidden;

    .poster-stack-item {
      position: relative;
      flex: none;
      width: var(--poster-stack-sliver-width);
      height: var(--poster-stack-height);
      overflow: hidden;
      box-shadow: var(--shadow-poster-fan);
    }

    .poster-stack-item:last-child {
      width: var(--poster-stack-poster-width);
    }

    .poster-stack-poster {
      position: absolute;
      inset-block-start: var(--ni-0);
      inset-inline-end: var(--ni-0);
      width: var(--poster-stack-poster-width);
      aspect-ratio: var(--aspect-poster);
    }

    @include for-mouse {
      &:hover .poster-stack-item {
        width: var(--poster-stack-sliver-width);
      }

      &:hover .poster-stack-item:hover {
        width: var(--poster-stack-poster-width);
      }
    }

    // Phones set the posters side by side, with no fan, hover included.
    @include for-mobile {
      width: 100%;
      height: auto;

      .poster-stack-item,
      .poster-stack-item:last-child,
      &:hover .poster-stack-item,
      &:hover .poster-stack-item:hover {
        width: var(--poster-stack-poster-width-mobile);
        height: auto;
      }

      .poster-stack-poster {
        position: relative;
        width: 100%;
      }
    }
  }
</style>
