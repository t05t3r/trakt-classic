<script lang="ts">
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
  import {
    BehaviorSubject,
    combineLatest,
    EMPTY,
    type Observable,
    of,
    switchMap,
  } from 'rxjs';
  import { BUILT_IN_LISTS } from './_internal/BUILT_IN_LISTS.ts';
  import ListReader from './_internal/ListReader.svelte';
  import ListItemsSection from './ListItemsSection.svelte';

  type BuiltInListPageProps = {
    list: keyof typeof BUILT_IN_LISTS;
    slug: string;
  };

  const { list, slug }: BuiltInListPageProps = $props();

  const LOADING = { kind: 'loading' } as const;

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

  const items = new BehaviorSubject<ListItems | undefined>(undefined);
  const reading = items.pipe(switchMap((current) => current?.reading ?? EMPTY));

  const watchedReads = new BehaviorSubject<
    Observable<WatchedPercentage | undefined>
  >(of(undefined));
  const watched = watchedReads.pipe(switchMap((current) => current));

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
    {#key `${valuesKey}:${count}`}
      <ListReader
        read={() => reader.watched(count)}
        onread={(next) => watchedReads.next(next)}
      />
    {/key}
  {/if}

  <UserCoverPage cover={$reading?.cover} selected="lists">
    <ListItemsSection
      status={$reading?.status ?? LOADING}
      key={(row: ListItemsRow) => row.entry.key}
      pages={{
        current: $reading?.pages.current ?? current.page,
        total: $reading?.pages.total ?? 1,
      }}
      title={built.title()}
      href={built.href(slug)}
      description={built.description()}
      emptyText={$reading?.isFiltered
        ? m.text_lists_empty_filtered()
        : built.emptyText()}
    >
      {#snippet toolbar({ open, panelId, close })}
        <ListStatsToolbar
          {params}
          watched={itemCount === undefined ? undefined : $watched}
          {itemCount}
          minutes={$reading?.minutes}
          pageCount={$reading?.pages.total}
          isPanelOpen={open}
          {panelId}
          onChoose={close}
        />
      {/snippet}
      {#snippet item(row: ListItemsRow)}
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
    </ListItemsSection>
  </UserCoverPage>
{/if}
