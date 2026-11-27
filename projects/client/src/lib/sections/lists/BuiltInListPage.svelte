<script lang="ts">
  import { FANART_COLUMNS } from '$lib/components/media/FANART_COLUMNS.ts';
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
    EMPTY,
    identity,
    type Observable,
    type ObservedValueOf,
    of,
  } from 'rxjs';
  import { BUILT_IN_LISTS } from './_internal/BUILT_IN_LISTS.ts';
  import ListReader from './ListReader.svelte';
  import ListItemsSection from './ListItemsSection.svelte';

  type BuiltInListPageProps = {
    list: keyof typeof BUILT_IN_LISTS;
    slug: string;
  };

  const { list, slug }: BuiltInListPageProps = $props();

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

  const { latest: watchedReads, reading: watched } = createKeyedReader<
    Observable<WatchedPercentage | undefined>,
    WatchedPercentage | undefined
  >({ initial: of(undefined), read: identity });

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

  {#if built.hasWatchedShare && $items && itemCount !== undefined}
    {@const reader = $items}
    {@const count = itemCount}
    {#key `${valuesKey}:${count}`}
      <ListReader
        read={() => reader.watched(count)}
        onread={(next) => watchedReads.next(next)}
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
          hasWatchedShare={built.hasWatchedShare}
          watched={itemCount === undefined ? undefined : $watched}
          {itemCount}
          minutes={$reading?.minutes}
          pageCount={$reading?.pages.total}
          {controls}
        />
      {/snippet}
      {#snippet grid(rows: ReadonlyArray<ListItemsRow>)}
        {@const isFanart = current.type === 'episode'}
        <PosterGrid
          items={rows}
          key={(row) => row.entry.key}
          columns={isFanart ? FANART_COLUMNS : undefined}
          phoneDivider={isFanart ? 'none' : undefined}
        >
          {#snippet item(row)}
            <ListGridCard
              entry={row.entry}
              card={row.card}
              droppedAt={row.droppedAt}
              isFaded={row.isFaded}
              sortBy={current.sort.by}
              hasRank={built.hasRank}
              favorite={built.hasFavorite}
              art={isFanart ? 'fanart' : undefined}
            />
          {/snippet}
        </PosterGrid>
      {/snippet}
    </ListItemsSection>
  </UserCoverPage>
{/if}
