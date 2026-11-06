<script lang="ts">
  import DividedPosterGrid from '$lib/components/media/DividedPosterGrid.svelte';
  import type { PosterGridColumns } from '$lib/components/media/PosterGridProps.ts';
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
  import ContainerPage from '$lib/sections/layout/ContainerPage.svelte';
  import UserCoverPage from '$lib/sections/layout/UserCoverPage.svelte';
  import ListItemsSection from '$lib/sections/lists/ListItemsSection.svelte';
  import ListReader from '$lib/sections/lists/ListReader.svelte';
  import HistoryToolbar from '$lib/sections/subnav/HistoryToolbar.svelte';
  import { useDividers } from '$lib/stores/useDividers.ts';
  import { hasDateRange } from '$lib/utils/date/hasDateRange.ts';
  import { createFocusRetention } from '$lib/utils/focus/createFocusRetention.ts';
  import { firstFocusable } from '$lib/utils/focus/firstFocusable.ts';
  import { createKeyedReader } from '$lib/utils/store/createKeyedReader.ts';
  import { fromRune } from '$lib/utils/store/fromRune.svelte.ts';
  import { combineLatest, EMPTY, type Observable } from 'rxjs';
  import { tick } from 'svelte';

  const FANART_COLUMNS = {
    desktop: 4,
    tabletLarge: 3,
    tabletSmall: 2,
    mobile: 1,
  } satisfies PosterGridColumns;

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
    Observable<HistoryReading> | undefined,
    HistoryReading
  >({ initial: undefined, read: (current) => current ?? EMPTY });

  const valuesKey = $derived(JSON.stringify($values));

  const itemCount = $derived(
    $reading?.itemCount === undefined
      ? undefined
      : ($stats?.items ?? $reading.itemCount),
  );

  let toolbarHost: HTMLElement | undefined = $state();
  const retention = createFocusRetention();

  // The X leaves with its filter, so the type menu takes its focus and Tab does not restart at the page's top.
  const settleFocus = async () => {
    // The item lands from a store's effect, a flush before the banner leaves.
    await tick();
    retention.settle(toolbarHost && firstFocusable(toolbarHost));
  };

  $effect(() => {
    void $values?.item;
    settleFocus();
  });
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
        <div bind:this={toolbarHost}>
          <HistoryToolbar
            {params}
            {dividers}
            {itemCount}
            plays={$stats?.plays}
            {controls}
          />
        </div>
        {#if current.item}
          <div class="trakt-history-item-band" {@attach retention.track}>
            <ContainerPage>
              {#key JSON.stringify(current.item)}
                <HistoryItemBanner
                  item={current.item}
                  entry={$reading?.entries?.at(0)}
                  isEmpty={$reading?.status.kind === 'empty'}
                  onClear={params.clearItem}
                />
              {/key}
            </ContainerPage>
          </div>
        {/if}
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

<style lang="scss">
  .trakt-history-item-band {
    padding-block: var(--ni-20);
    background: var(--color-surface-raised);
  }
</style>
