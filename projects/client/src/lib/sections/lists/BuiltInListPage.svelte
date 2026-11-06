<script lang="ts">
  import PosterGrid from '$lib/components/media/PosterGrid.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import ListGridCard from '$lib/features/lists/components/ListGridCard.svelte';
  import {
    LIST_TYPES,
    type ListDisplayType,
  } from '$lib/features/lists/LIST_TYPES.ts';
  import {
    type ListItems,
    type ListItemsRow,
    useListItems,
  } from '$lib/features/lists/stores/useListItems.ts';
  import { useListParams } from '$lib/features/lists/stores/useListParams.ts';
  import type { WatchedPercentage } from '$lib/features/lists/stores/useWatchedPercentage.ts';
  import UserCoverPage from '$lib/sections/layout/UserCoverPage.svelte';
  import ListStatsToolbar from '$lib/sections/subnav/ListStatsToolbar.svelte';
  import { createKeyedReader } from '$lib/utils/store/createKeyedReader.ts';
  import {
    combineLatest,
    distinctUntilChanged,
    EMPTY,
    map,
    type Observable,
    type ObservedValueOf,
    of,
    scan,
  } from 'rxjs';
  import { BUILT_IN_LISTS } from './_internal/BUILT_IN_LISTS.ts';
  import ListReader from './ListReader.svelte';
  import ListItemsSection from './ListItemsSection.svelte';

  type BuiltInListPageProps = {
    list: keyof typeof BUILT_IN_LISTS;
    slug: string;
  };

  const { list, slug }: BuiltInListPageProps = $props();

  type WatchedRead = {
    set: string;
    read: Observable<WatchedPercentage | undefined>;
  };
  type WatchedReading = { set: string; value: WatchedPercentage | undefined };

  // A sort or page pick over the same items and count keeps the last share until the new read lands.
  function keepWhilePending(
    previous: WatchedReading,
    next: WatchedReading,
  ): WatchedReading {
    if (next.value !== undefined) return next;
    if (next.set !== previous.set) return next;

    return previous;
  }

  // Each route passes a constant list, so the params made here serve the page's whole life.
  // svelte-ignore state_referenced_locally
  const params = useListParams<ListDisplayType>({ types: LIST_TYPES[list] });
  const built = $derived(BUILT_IN_LISTS[list]);
  const values = combineLatest({
    sort: params.sort,
    type: params.type,
    genre: params.genre,
    page: params.page,
  });

  const { latest: items, reading } = createKeyedReader<
    ListItems | undefined,
    ObservedValueOf<ListItems['reading']>
  >({ initial: undefined, read: (current) => current?.reading ?? EMPTY });

  const { latest: watchedReads, reading: watchedReading } = createKeyedReader<
    WatchedRead,
    WatchedReading
  >({
    initial: { set: '', read: of(undefined) },
    read: ({ set, read }) => read.pipe(map((value) => ({ set, value }))),
  });
  const watched = watchedReading.pipe(
    scan(keepWhilePending),
    map(({ value }) => value),
    distinctUntilChanged(),
  );

  const valuesKey = $derived(JSON.stringify($values));
  const itemCount = $derived($reading?.itemCount);
</script>

{#if $values}
  {@const current = $values}
  {#key valuesKey}
    <ListReader
      read={() => useListItems({ list, params, values: current })}
      onread={(next) => items.next(next)}
    />
  {/key}

  {#if $items && itemCount !== undefined}
    {@const reader = $items}
    {@const count = itemCount}
    {@const set = JSON.stringify({
      type: current.type,
      genre: current.genre,
      count,
    })}
    {#key `${valuesKey}:${count}`}
      <ListReader
        read={() => reader.watched(count)}
        onread={(next) => watchedReads.next({ set, read: next })}
      />
    {/key}
  {/if}

  <UserCoverPage cover={$reading?.cover} selected="lists">
    <ListItemsSection
      reading={$reading}
      heading={{
        title: built.title(),
        href: built.href(slug),
        description: built.description(),
      }}
      emptyText={$reading?.isFiltered
        ? m.text_lists_empty_filtered()
        : built.emptyText()}
    >
      {#snippet toolbar(controls)}
        <ListStatsToolbar
          {params}
          watched={itemCount === undefined ? undefined : $watched}
          {itemCount}
          minutes={$reading?.minutes}
          pageCount={$reading?.pages.total}
          {controls}
        />
      {/snippet}
      {#snippet grid(rows: ReadonlyArray<ListItemsRow>)}
        <PosterGrid items={rows} key={(row) => row.entry.key}>
          {#snippet item(row)}
            <ListGridCard
              entry={row.entry}
              card={row.card}
              droppedAt={row.droppedAt}
              isFaded={row.isFaded}
              sortBy={current.sort.by}
              hasRank={built.hasRank}
              favorite={built.hasFavorite}
            />
          {/snippet}
        </PosterGrid>
      {/snippet}
    </ListItemsSection>
  </UserCoverPage>
{/if}
