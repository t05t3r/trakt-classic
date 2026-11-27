<script lang="ts" generics="T extends ListDisplayType">
  import ChoiceMenu from '$lib/components/menus/ChoiceMenu.svelte';
  import SortControls from '$lib/components/menus/SortControls.svelte';
  import CountStat from '$lib/components/stats/CountStat.svelte';
  import HumanizedMinutes from '$lib/components/stats/HumanizedMinutes.svelte';
  import { GENRES } from '$lib/features/filters/GENRES.ts';
  import WatchedFilterMenu from '$lib/features/filters/WatchedFilterMenu.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { LIST_SORT } from '$lib/features/lists/LIST_SORT.ts';
  import { isDefaultSort } from '$lib/features/view-params/isDefaultSort.ts';
  import type { ListDisplayType } from '$lib/features/lists/LIST_TYPES.ts';
  import { toListTypeSegment } from '$lib/features/lists/toListTypeSegment.ts';
  import type { SortBy } from '$lib/models/SortBy.ts';
  import { toGroupedNumber } from '$lib/utils/formatting/number/toGroupedNumber.ts';
  import { toPercentage } from '$lib/utils/formatting/number/toPercentage.ts';
  import { toTranslatedGenre } from '$lib/utils/formatting/string/toTranslatedGenre.ts';
  import IconCheck from '@tabler/icons-svelte/icons/check';
  import IconClockPlay from '@tabler/icons-svelte/icons/clock-play';
  import ItemCountStat from './_internal/ItemCountStat.svelte';
  import type { ListStatsToolbarProps } from './_internal/ListStatsToolbarProps.ts';
  import { thenChoose } from './_internal/thenChoose.ts';
  import { TYPE_LABELS } from './_internal/TYPE_LABELS.ts';
  import TypeMenu from './_internal/TypeMenu.svelte';
  import SubnavToolbar from './SubnavToolbar.svelte';

  const SORT_LABELS: Record<SortBy, () => string> = {
    rank: m.button_text_sort_rank,
    added: m.button_text_sort_added_date,
    title: m.button_text_sort_title,
    released: m.button_text_sort_release_date,
    runtime: m.button_text_sort_runtime,
    popularity: m.button_text_sort_popularity,
    percentage: m.button_text_sort_rating,
    votes: m.button_text_sort_votes,
    my_rating: m.button_text_sort_my_rating,
  };

  const GENRE_CHOICES = GENRES.map((genre) => ({
    value: genre,
    label: toTranslatedGenre(genre),
  }));

  const SORT_CHOICES = LIST_SORT.sorts.map(({ by }) => ({
    value: by,
    label: SORT_LABELS[by](),
  }));

  const {
    params,
    hasWatchedShare,
    watched,
    itemCount,
    minutes,
    pageCount,
    controls,
  }: ListStatsToolbarProps<T> = $props();

  const sort = $derived(params.sort);
  const type = $derived(params.type);
  const genre = $derived(params.genre);
  const watchedFilter = $derived(params.watched);

  const isSortChanged = $derived(!isDefaultSort($sort, LIST_SORT.sorts));

  const typeChoices = $derived(
    params.types.map((value) => ({
      value,
      label: TYPE_LABELS[toListTypeSegment(value)](),
    })),
  );

  const hasRuntime = $derived(pageCount !== undefined && pageCount <= 1);
</script>

{#snippet runtime()}
  {#if minutes !== undefined}
    <HumanizedMinutes {minutes} />
  {/if}
{/snippet}

<SubnavToolbar
  {controls}
  changed={$type !== null || $genre !== null || isSortChanged}
>
  {#snippet start()}
    <TypeMenu
      value={$type}
      choices={typeChoices}
      onChange={thenChoose(controls, params.setType)}
      onRepick={controls.close}
    />
    <ChoiceMenu
      label={m.label_list_genre()}
      triggerLabel={(shown) => m.button_label_list_genre({ genre: shown })}
      value={$genre}
      choices={GENRE_CHOICES}
      all={m.button_text_genre_all()}
      onChange={thenChoose(controls, params.setGenre)}
      onRepick={controls.close}
      isLimited
    />
  {/snippet}
  {#snippet stats()}
    {#if hasWatchedShare}
      <CountStat
        icon={IconCheck}
        size="lg"
        value={watched ? toPercentage(watched.percentage / 100) : ''}
        label={m.text_lists_watched()}
        underCount={watched
          ? m.text_lists_watched_count({
            watched: toGroupedNumber(watched.watched),
            count: toGroupedNumber(watched.count),
          })
          : undefined}
      />
    {/if}
    {#if hasRuntime}
      <CountStat
        icon={IconClockPlay}
        size="lg"
        value={runtime}
        label={m.text_lists_runtime()}
      />
    {/if}
    <ItemCountStat {itemCount} />
  {/snippet}
  {#snippet options()}
    <SortControls
      value={$sort.by}
      choices={SORT_CHOICES}
      onSelect={thenChoose(controls, params.selectSort)}
      onRepick={controls.close}
      pressed={$sort.how === 'desc'}
      onReverse={thenChoose(controls, params.reverseSort)}
      changed={isSortChanged}
    />
  {/snippet}
  {#snippet end()}
    <WatchedFilterMenu
      value={$watchedFilter}
      onValueChange={params.setWatched}
    />
  {/snippet}
</SubnavToolbar>
