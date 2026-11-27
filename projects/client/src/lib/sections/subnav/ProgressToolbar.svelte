<script lang="ts">
  import ChoiceMenu from '$lib/components/menus/ChoiceMenu.svelte';
  import SortControls from '$lib/components/menus/SortControls.svelte';
  import CountStat from '$lib/components/stats/CountStat.svelte';
  import HumanizedMinutes from '$lib/components/stats/HumanizedMinutes.svelte';
  import WatchedFilterMenu from '$lib/features/filters/WatchedFilterMenu.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { DEFAULT_PROGRESS_VIEW } from '$lib/features/progress/DEFAULT_PROGRESS_VIEW.ts';
  import {
    PROGRESS_SORTS,
    type ProgressView,
  } from '$lib/features/progress/PROGRESS_SORTS.ts';
  import { isDefaultSort } from '$lib/features/view-params/isDefaultSort.ts';
  import { countText } from '$lib/utils/formatting/number/countText.ts';
  import { toFlooredPercentage } from '$lib/utils/formatting/number/toFlooredPercentage.ts';
  import { toGroupedNumber } from '$lib/utils/formatting/number/toGroupedNumber.ts';
  import IconCheck from '@tabler/icons-svelte/icons/check';
  import IconClockPlay from '@tabler/icons-svelte/icons/clock-play';
  import ItemCountStat from './_internal/ItemCountStat.svelte';
  import type { ProgressToolbarProps } from './_internal/ProgressToolbarProps.ts';
  import { thenChoose } from './_internal/thenChoose.ts';
  import SubnavToolbar from './SubnavToolbar.svelte';

  const VIEW_CHOICES: ReadonlyArray<{ value: ProgressView; label: string }> = [
    { value: 'watched', label: m.text_progress_view_watched() },
    { value: 'dropped', label: m.text_progress_view_dropped() },
  ];

  // Renamed: inside the `stats` snippet below, the name types as the snippet.
  const { params, stats: totals, controls }: ProgressToolbarProps = $props();

  const filters = $derived(params.filters);
  const watched = $derived(params.watched);

  const isViewChanged = $derived($filters.view !== DEFAULT_PROGRESS_VIEW);
  const isSortChanged = $derived(
    !isDefaultSort($filters.sort, PROGRESS_SORTS[$filters.view]),
  );

  const sortChoices = $derived(
    PROGRESS_SORTS[$filters.view].map(({ by, label }) => ({
      value: by,
      label: label(),
    })),
  );
</script>

{#snippet timeLeft()}
  {#if totals}
    <HumanizedMinutes minutes={totals.minutesLeft} />
  {/if}
{/snippet}

<SubnavToolbar {controls} changed={isViewChanged || isSortChanged}>
  {#snippet start()}
    <ChoiceMenu
      label={m.label_progress_view()}
      triggerLabel={(view) => m.button_label_progress_view({ view })}
      value={$filters.view}
      choices={VIEW_CHOICES}
      onChange={thenChoose(controls, params.setView)}
      onRepick={controls.close}
      changed={isViewChanged}
    />
  {/snippet}
  {#snippet stats()}
    <CountStat
      icon={IconCheck}
      size="lg"
      value={totals
        ? toFlooredPercentage({ value: totals.completed, total: totals.aired })
        : ''}
      label={m.text_lists_watched()}
      underCount={totals
        ? m.text_progress_episodes_of({
          completed: toGroupedNumber(totals.completed),
          aired: toGroupedNumber(totals.aired),
        })
        : undefined}
    />
    <CountStat
      icon={IconClockPlay}
      size="lg"
      value={timeLeft}
      label={m.text_progress_time_left()}
      underCount={totals
        ? countText.of({
          count: totals.aired - totals.completed,
          unit: 'episodes',
        })
        : undefined}
    />
    <ItemCountStat itemCount={totals?.shows} unit="shows" wideLabel />
  {/snippet}
  {#snippet options()}
    <SortControls
      value={$filters.sort.by}
      choices={sortChoices}
      onSelect={thenChoose(controls, params.selectSort)}
      onRepick={controls.close}
      pressed={$filters.sort.how === 'desc'}
      onReverse={thenChoose(controls, params.reverseSort)}
      changed={isSortChanged}
    />
  {/snippet}
  {#snippet end()}
    <WatchedFilterMenu value={$watched} onValueChange={params.setWatched} />
  {/snippet}
</SubnavToolbar>
