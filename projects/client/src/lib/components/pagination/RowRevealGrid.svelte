<script lang="ts" generics="T">
  import RenderFor from '$lib/guards/RenderFor.svelte';
  import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
  import { useMedia } from '$lib/stores/css/useMedia.ts';
  import { untrack } from 'svelte';
  import LoadMore from './LoadMore.svelte';
  import { createFocusKeeper } from './_internal/createFocusKeeper.ts';
  import type { RowRevealGridProps } from './_internal/RowRevealGridProps.ts';
  import { rowReveal } from './_internal/rowReveal.ts';

  let {
    items,
    key,
    columns,
    rowMax,
    rowCount = $bindable(),
    reveal = $bindable(),
    item,
    navigator = 'always',
    variant,
    bottomGap = 'default',
    phoneRows = 'desktop',
    phoneCellGap = 'default',
    fallbackFocus,
  }: RowRevealGridProps<T> = $props();

  const isMobile = useMedia(WELL_KNOWN_MEDIA_QUERY.mobile);
  const isTabletSmall = useMedia(WELL_KNOWN_MEDIA_QUERY.tabletSmall);

  // Phones reflow the desktop count into fewer columns unless their rows are phone rows.
  const toPerRow = (): number => {
    if (phoneRows === 'mobile' && $isMobile) return columns.mobile;
    if ($isTabletSmall) return columns.tablet;

    return columns.desktop;
  };

  const perRow = $derived(toPerRow());
  const revealed = $derived(
    rowReveal({ itemCount: items.length, perRow, rowCount, rowMax }),
  );

  const isReported = $derived(
    reveal?.showLess === revealed.showLess &&
      reveal?.showMore === revealed.showMore &&
      reveal?.openRows === revealed.openRows,
  );

  $effect(() => {
    if (isReported) return;

    reveal = {
      showLess: revealed.showLess,
      showMore: revealed.showMore,
      openRows: revealed.openRows,
    };
  });

  let root = $state<HTMLElement>();
  const focusKeeper = createFocusKeeper();
  const sectionOf = (grid: HTMLElement) => grid.closest('section');

  // Each teardown runs after the cells moved, collapsed or left, the last one
  // after the grid itself left, when its root no longer finds the fallback.
  $effect(() => {
    void items;
    void revealed.visibleCount;
    const grid = root;
    const fallback = grid && untrack(() => (fallbackFocus ?? sectionOf)(grid));

    return () => focusKeeper.settle(fallback);
  });
</script>

<div
  class="trakt-row-reveal-grid"
  data-variant={variant}
  data-bottom-gap={variant ? bottomGap : undefined}
  data-phone-cell-gap={phoneCellGap}
  bind:this={root}
  {@attach focusKeeper.track}
  style="--row-reveal-columns-desktop: {columns.desktop}; --row-reveal-columns-tablet: {columns.tablet}; --row-reveal-columns-mobile: {columns.mobile}"
>
  <div class="row-reveal-cells">
    {#each items as entry, index (key(entry))}
      {@const isCollapsed = index >= revealed.visibleCount}
      <div
        class="row-reveal-cell"
        class:is-collapsed={isCollapsed}
        inert={isCollapsed}
      >
        {@render item(entry)}
      </div>
    {/each}
  </div>

  {#if navigator === 'always'}
    {@render navigatorControl()}
  {:else if navigator === 'mobile'}
    <RenderFor audience="all" device={['mobile']}>
      {@render navigatorControl()}
    </RenderFor>
  {/if}
</div>

{#snippet navigatorControl()}
  <LoadMore
    showLess={revealed.showLess}
    showMore={revealed.showMore}
    onless={() => (rowCount = revealed.openRows - 1)}
    onmore={() => (rowCount = revealed.openRows + 1)}
  />
{/snippet}

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-row-reveal-grid {
    --row-reveal-columns: var(--row-reveal-columns-desktop);

    position: relative;

    @include for-tablet-sm {
      --row-reveal-columns: var(--row-reveal-columns-tablet);
    }

    @include for-mobile {
      --row-reveal-columns: var(--row-reveal-columns-mobile);
    }

    .row-reveal-cells {
      display: grid;
      grid-template-columns: repeat(
        var(--row-reveal-columns),
        minmax(var(--grid-column-track-min), var(--grid-column-track-max))
      );
      margin-inline: var(--gutter-half-negative);
    }

    .row-reveal-cell {
      margin-block-start: var(--gap-l);
      padding-inline: var(--gutter-half);
      transition: opacity var(--transition-default);

      &.is-collapsed {
        height: var(--ni-0);
        min-height: var(--ni-0);
        margin-block-start: var(--ni-0);
        overflow: hidden;
        opacity: 0;
      }
    }

    &[data-phone-cell-gap='none'] .row-reveal-cell {
      @include for-mobile {
        margin-block-start: var(--ni-0);
      }
    }

    &[data-variant='posters'] {
      &[data-bottom-gap='default'] .row-reveal-cells {
        margin-block-end: var(--gap-l);
      }

      @include phone-poster-cells('.row-reveal-cell');
    }

    // Fanart rows are spaced below each cell, not above it.
    &[data-variant='fanart'] {
      .row-reveal-cells {
        margin-block: var(--gap-l) var(--gap-xl);
      }

      .row-reveal-cell {
        margin-block: var(--ni-0) var(--gap-l);

        &.is-collapsed {
          margin-block-end: var(--ni-0);
        }
      }

      @include for-mobile {
        --load-more-offset: var(--ni-neg-12);

        .row-reveal-cell {
          margin-block-end: var(--ni-0);
          padding-inline: var(--ni-0);
        }
      }
    }
  }
</style>
