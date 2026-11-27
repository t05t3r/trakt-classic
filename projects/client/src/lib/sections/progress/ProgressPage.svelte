<script lang="ts">
  import ClearButton from '$lib/components/buttons/ClearButton.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import type { ProgressFilters } from '$lib/features/progress/ProgressFilters.ts';
  import type { ProgressReading } from '$lib/features/progress/ProgressReading.ts';
  import { useDroppedItems } from '$lib/features/progress/stores/useDroppedItems.ts';
  import {
    type ProgressListValues,
    useProgressList,
  } from '$lib/features/progress/stores/useProgressList.ts';
  import { useProgressParams } from '$lib/features/progress/stores/useProgressParams.ts';
  import UserCoverPage from '$lib/sections/layout/UserCoverPage.svelte';
  import ListItemsSection from '$lib/sections/lists/ListItemsSection.svelte';
  import ListReader from '$lib/sections/lists/ListReader.svelte';
  import ToolbarFilterBand from '$lib/sections/lists/ToolbarFilterBand.svelte';
  import ProgressToolbar from '$lib/sections/subnav/ProgressToolbar.svelte';
  import { createKeyedReader } from '$lib/utils/store/createKeyedReader.ts';
  import { fromRune } from '$lib/utils/store/fromRune.svelte.ts';
  import { combineLatest, EMPTY, identity, type Observable } from 'rxjs';
  import ProgressRow from './ProgressRow.svelte';

  type ProgressPageValues =
    & Omit<ProgressListValues, 'filters'>
    & Readonly<{ filters: ProgressFilters }>;

  const { filters }: { filters: string } = $props();

  const toEmptyText = (
    { filters, show, watched }: ProgressPageValues,
  ) => {
    if (show !== null) return m.text_progress_empty_show();
    // Hide filters the dropped rows before they are read, so an empty read cannot tell why.
    if (filters.view === 'dropped') return m.list_placeholder_dropped_shows();
    if (watched === 'hide') return m.text_progress_empty_hidden();

    return m.text_progress_empty_watched();
  };

  const params = useProgressParams(fromRune(() => filters));
  const values = combineLatest({
    filters: params.filters,
    watched: params.watched,
    show: params.show,
    page: params.page,
  });

  const readList = (
    { filters, watched, show, page }: ProgressPageValues,
  ): Observable<ProgressReading> => {
    const { replacePage } = params;
    if (filters.view === 'dropped') {
      return useDroppedItems({
        values: { filters, watched, page },
        replacePage,
      });
    }

    return useProgressList({
      values: { filters, watched, show, page },
      replacePage,
    });
  };

  // Every read emits on subscribe, so the dropped view never keeps the watched view's last reading.
  const { latest: lists, reading } = createKeyedReader<
    Observable<ProgressReading>,
    ProgressReading
  >({ initial: EMPTY, read: identity });

  const valuesKey = $derived(JSON.stringify($values));
  const pageTitle = $derived(
    $values?.filters.view === 'dropped'
      ? m.page_title_progress_dropped()
      : m.page_title_progress(),
  );
</script>

<svelte:head>
  <title>{pageTitle} · {m.text_app_name()}</title>
</svelte:head>

{#if $values}
  {@const current = $values}
  {#key valuesKey}
    <ListReader
      read={() => readList(current)}
      onread={(next) => lists.next(next)}
    />
  {/key}

  <UserCoverPage cover={$reading?.cover} selected="progress">
    <ListItemsSection
      reading={$reading}
      emptyText={toEmptyText(current)}
      cellSelector=".trakt-progress-list > li"
    >
      {#snippet toolbar(controls)}
        <ToolbarFilterBand filter={current.show} {controls}>
          {#snippet toolbar()}
            <ProgressToolbar {params} stats={$reading?.stats} {controls} />
          {/snippet}
          {#snippet band()}
            <ClearButton
              label={m.button_text_progress_all()}
              isLabelShown
              onclick={params.clearShow}
            />
          {/snippet}
        </ToolbarFilterBand>
      {/snippet}
      {#snippet grid(rows)}
        <ul class="trakt-progress-list" role="list">
          {#each rows as row (row.entry.show.id)}
            <li>
              <ProgressRow
                row={row.entry}
                isFaded={row.isFaded}
                droppedAt={row.droppedAt}
              />
            </li>
          {/each}
        </ul>
      {/snippet}
    </ListItemsSection>
  </UserCoverPage>
{/if}

<style lang="scss">
  .trakt-progress-list {
    margin: var(--ni-0);
    padding: var(--ni-0);
    list-style: none;

    > li + li {
      border-block-start: var(--border-thickness-xxs) solid var(--divider-rule);
    }
  }
</style>
