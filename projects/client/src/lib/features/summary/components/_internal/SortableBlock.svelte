<script lang="ts" generics="T, K extends string">
  import DropdownButton from '$lib/components/buttons/DropdownButton.svelte';
  import IconToggle from '$lib/components/buttons/IconToggle.svelte';
  import SectionState from '$lib/components/feedback/SectionState.svelte';
  import PosterGrid from '$lib/components/media/PosterGrid.svelte';
  import Menu from '$lib/components/menus/Menu.svelte';
  import MenuItem from '$lib/components/menus/MenuItem.svelte';
  import MenuRadioGroup from '$lib/components/menus/MenuRadioGroup.svelte';
  import { useWatchedFilter } from '$lib/features/filters/stores/useWatchedFilter.ts';
  import WatchedFilterMenu from '$lib/features/filters/WatchedFilterMenu.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { useSortParam } from '$lib/features/view-params/stores/useSortParam.ts';
  import IconArrowDown from '@tabler/icons-svelte/icons/arrow-down';
  import IconArrowUp from '@tabler/icons-svelte/icons/arrow-up';
  import type { SortableBlockProps } from './SortableBlockProps.ts';

  const {
    title,
    status,
    emptyText,
    sort: spec,
    isWatched,
    grid,
    item: cell,
  }: SortableBlockProps<T, K> = $props();

  // Each caller passes a constant sort spec, so the store made here serves the block's whole life.
  // svelte-ignore state_referenced_locally
  const { sort, isReversed, select, reverse } = useSortParam(spec);
  const { filter, set: setFilter } = useWatchedFilter();

  const shownItems = $derived.by(() => {
    if (status.kind !== 'ready') return [];
    const sorted = spec.apply({ items: status.data, sort: $sort });
    if ($filter !== 'hide') return sorted;
    return sorted.filter((entry) => !isWatched(entry));
  });

  const sortLabel = $derived(spec.labels[$sort.by]());

  // Choosing the checked row reports null, which keeps the sort as it is.
  const selectSort = (next: string | null) => {
    const by = spec.sorts.find((entry) => entry.by === next)?.by;
    if (!by) return;
    select(by);
  };
</script>

{#snippet tools()}
  <div class="sort-wrapper">
    <Menu label={m.label_sort_by()}>
      {#snippet trigger({ props })}
        <DropdownButton
          {...props}
          label={m.button_label_sort_by({ sort: sortLabel })}
          font="heading"
        >
          {sortLabel}
        </DropdownButton>
      {/snippet}

      <MenuRadioGroup value={$sort.by} onValueChange={selectSort}>
        {#each spec.sorts as { by } (by)}
          <MenuItem radio={by}>{spec.labels[by]()}</MenuItem>
        {/each}
      </MenuRadioGroup>
    </Menu>
    <span class="sort-direction">
      <IconToggle
        label={m.button_label_sort_direction()}
        pressed={$isReversed}
        onToggle={reverse}
        size="heading"
      >
        {#if $isReversed}
          <IconArrowUp aria-hidden="true" />
        {:else}
          <IconArrowDown aria-hidden="true" />
        {/if}
      </IconToggle>
    </span>
    <WatchedFilterMenu value={$filter} onValueChange={setFilter} />
  </div>
{/snippet}

<div class="trakt-sortable-block">
  <SectionState header={{ title, tools }} {status} {emptyText}>
    <!-- Classic kept the header alone, with no empty text, when the filter hid every item. -->
    {#if shownItems.length > 0}
      <PosterGrid items={shownItems} {...grid}>
        {#snippet item(entry)}
          <div
            class="sortable-item"
            class:is-faded={$filter === 'fade' && isWatched(entry)}
          >
            {@render cell(entry)}
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

    .sort-direction {
      display: inline-flex;
      margin-inline: var(--ni-4) var(--ni-10);
    }

    .sortable-item.is-faded {
      opacity: var(--watched-fade-opacity);

      &:focus-within {
        opacity: 1;
      }

      @include for-mouse {
        &:hover {
          opacity: 1;
        }
      }
    }
  }
</style>
