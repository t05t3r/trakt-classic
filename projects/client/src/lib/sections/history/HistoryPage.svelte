<script lang="ts">
  import DividedPosterGrid from '$lib/components/media/DividedPosterGrid.svelte';
  import { FANART_COLUMNS } from '$lib/components/media/FANART_COLUMNS.ts';
  import HistoryGridCard from '$lib/features/history/components/HistoryGridCard.svelte';
  import HistoryItemBanner from '$lib/features/history/components/HistoryItemBanner.svelte';
  import {
    type HistoryItemsValues,
    type HistoryReading,
    type HistoryRow,
    useHistoryItems,
  } from '$lib/features/history/stores/useHistoryItems.ts';
  import { useHistoryParams } from '$lib/features/history/stores/useHistoryParams.ts';
  import { useHistoryStats } from '$lib/features/history/stores/useHistoryStats.ts';
  import { toPlayMinutes } from '$lib/features/history/toPlayMinutes.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import UserCoverPage from '$lib/sections/layout/UserCoverPage.svelte';
  import ListItemsSection from '$lib/sections/lists/ListItemsSection.svelte';
  import ListReader from '$lib/sections/lists/ListReader.svelte';
  import ToolbarFilterBand from '$lib/sections/lists/ToolbarFilterBand.svelte';
  import HistoryToolbar from '$lib/sections/subnav/HistoryToolbar.svelte';
  import { useDividers } from '$lib/stores/useDividers.ts';
  import { hasDateRange } from '$lib/utils/date/hasDateRange.ts';
  import { createKeyedReader } from '$lib/utils/store/createKeyedReader.ts';
  import { fromRune } from '$lib/utils/store/fromRune.svelte.ts';
  import { combineLatest, EMPTY, identity, type Observable } from 'rxjs';

  const { filters }: { filters: string } = $props();

  const toEmptyText = ({ type, genres, range }: HistoryItemsValues) => {
    if (hasDateRange(range)) return m.text_history_empty_range();
    if (type !== 'all' || genres !== null) return m.text_lists_empty_filtered();

    return m.text_history_empty();
  };

  const params = useHistoryParams(fromRune(() => filters));
  const values = combineLatest({
    type: params.type,
    item: params.item,
    genres: params.genres,
    range: params.range,
    page: params.page,
  });

  const stats = useHistoryStats(params);

  const dividers = useDividers();
  const { shown } = dividers;

  const { latest: items, reading } = createKeyedReader<
    Observable<HistoryReading>,
    HistoryReading
  >({ initial: EMPTY, read: identity });

  const valuesKey = $derived(JSON.stringify($values));

  const itemCount = $derived(
    $reading?.itemCount === undefined
      ? undefined
      : ($stats?.items ?? $reading.itemCount),
  );
</script>

{#if $values}
  {@const current = $values}
  {@const isFanart = current.type === 'episodes'}
  {#key valuesKey}
    <ListReader
      read={() =>
        useHistoryItems({
          values: current,
          replacePage: params.replacePage,
        })}
      onread={(next) => items.next(next)}
    />
  {/key}

  <UserCoverPage cover={$reading?.cover} selected="history">
    <ListItemsSection
      reading={$reading}
      emptyText={toEmptyText(current)}
    >
      {#snippet toolbar(controls)}
        <ToolbarFilterBand filter={current.item} {controls}>
          {#snippet toolbar()}
            <HistoryToolbar
              {params}
              {dividers}
              {itemCount}
              plays={$stats?.plays}
              {controls}
            />
          {/snippet}
          {#snippet band(item)}
            {#key JSON.stringify(item)}
              <HistoryItemBanner
                {item}
                entry={$reading?.entries?.at(0)}
                isEmpty={$reading?.status.kind === 'empty'}
                onClear={params.clearItem}
              />
            {/key}
          {/snippet}
        </ToolbarFilterBand>
      {/snippet}
      {#snippet grid(rows: ReadonlyArray<HistoryRow>)}
        {#key valuesKey}
          <DividedPosterGrid
            items={rows}
            divided={$shown}
            dayOf={(row) => row.entry.watchedAt}
            minutesOf={current.type === 'shows'
              ? undefined
              : (row) => toPlayMinutes(row.entry)}
            key={(row) => row.entry.key}
            columns={isFanart ? FANART_COLUMNS : undefined}
            phoneDivider={isFanart ? 'none' : undefined}
          >
            {#snippet item(row)}
              <HistoryGridCard {row} art={isFanart ? 'fanart' : undefined} />
            {/snippet}
          </DividedPosterGrid>
        {/key}
      {/snippet}
    </ListItemsSection>
  </UserCoverPage>
{/if}
