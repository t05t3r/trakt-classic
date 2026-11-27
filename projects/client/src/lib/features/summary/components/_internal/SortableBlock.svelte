<script lang="ts" generics="T, K extends string">
  import SectionState from '$lib/components/feedback/SectionState.svelte';
  import PosterGrid from '$lib/components/media/PosterGrid.svelte';
  import SortControls from '$lib/components/menus/SortControls.svelte';
  import { applyWatchedFilter } from '$lib/features/filters/applyWatchedFilter.ts';
  import { useWatchedFilter } from '$lib/features/filters/stores/useWatchedFilter.ts';
  import WatchedFilterMenu from '$lib/features/filters/WatchedFilterMenu.svelte';
  import { withWatchedKnown } from '$lib/features/filters/withWatchedKnown.ts';
  import { useSortParam } from '$lib/features/view-params/stores/useSortParam.ts';
  import type { SortableBlockProps } from './SortableBlockProps.ts';

  const {
    title,
    status,
    emptyText,
    sort: spec,
    isWatched,
    watchedStatus,
    grid,
    item: cell,
  }: SortableBlockProps<T, K> = $props();

  // Each caller passes a constant sort spec, so the store made here serves the block's whole life.
  // svelte-ignore state_referenced_locally
  const { sort, isReversed, select, reverse } = useSortParam(spec);
  const { filter, set: setFilter } = useWatchedFilter();

  const shownStatus = $derived(
    withWatchedKnown({ status, filter: $filter, known: watchedStatus }),
  );

  const shownRows = $derived.by(() => {
    if (shownStatus.kind !== 'ready') return [];
    const sorted = spec.apply({ items: shownStatus.data, sort: $sort });
    return applyWatchedFilter({ items: sorted, filter: $filter, isWatched });
  });

  const sortChoices = $derived(
    spec.sorts.map(({ by }) => ({ value: by, label: spec.labels[by]() })),
  );
</script>

{#snippet tools()}
  <div class="sort-wrapper">
    <SortControls
      value={$sort.by}
      choices={sortChoices}
      onSelect={select}
      pressed={$isReversed}
      onReverse={reverse}
      size="heading"
    >
      {#snippet toggles()}
        <WatchedFilterMenu value={$filter} onValueChange={setFilter} />
      {/snippet}
    </SortControls>
  </div>
{/snippet}

<div class="trakt-sortable-block">
  <SectionState header={{ title, tools }} status={shownStatus} {emptyText}>
    <!-- Classic kept the header alone, with no empty text, when the filter hid every item. -->
    {#if shownRows.length > 0}
      <PosterGrid
        items={shownRows}
        {...grid}
        key={(row) => grid.key(row.item)}
      >
        {#snippet item(row)}
          <div class="sortable-item" class:is-faded={row.isFaded}>
            {@render cell(row.item)}
          </div>
        {/snippet}
      </PosterGrid>
    {/if}
  </SectionState>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-sortable-block {
    // Classic floated the sort controls out of the title's line, so they add no height to it.
    .sort-wrapper {
      display: flex;
      align-items: center;
      height: var(--ni-0);
    }

    .sortable-item.is-faded {
      @include watched-fade;
    }
  }
</style>
