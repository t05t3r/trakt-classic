<script lang="ts">
  import CountStat from '$lib/components/stats/CountStat.svelte';
  import {
    HISTORY_TYPES,
    type HistoryType,
  } from '$lib/features/history/HISTORY_TYPES.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import { countText } from '$lib/utils/formatting/number/countText.ts';
  import { toGroupedNumber } from '$lib/utils/formatting/number/toGroupedNumber.ts';
  import IconCheck from '@tabler/icons-svelte/icons/check';
  import DateRangeButton from './_internal/DateRangeButton.svelte';
  import DividersToggle from './_internal/DividersToggle.svelte';
  import type { HistoryToolbarProps } from './_internal/HistoryToolbarProps.ts';
  import ItemCountStat from './_internal/ItemCountStat.svelte';
  import SingleSortMenu from './_internal/SingleSortMenu.svelte';
  import { toTypeChoices } from './_internal/toTypeChoices.ts';
  import TypeMenu from './_internal/TypeMenu.svelte';
  import SubnavToolbar from './SubnavToolbar.svelte';

  const TYPE_CHOICES = toTypeChoices(HISTORY_TYPES);

  const {
    params,
    dividers,
    itemCount,
    plays,
    controls,
  }: HistoryToolbarProps = $props();

  const type = $derived(params.type);
  const item = $derived(params.item);

  const selectType = (value: HistoryType | null) =>
    params.setType(value ?? 'all');
</script>

<SubnavToolbar {controls} panel="none" phone="controls">
  {#snippet start()}
    <TypeMenu
      value={$type === 'all' ? null : $type}
      choices={TYPE_CHOICES}
      onChange={selectType}
      onRepick={$item ? () => params.setType($type) : undefined}
    />
    <DateRangeButton {params} />
  {/snippet}
  {#snippet stats()}
    <ItemCountStat {itemCount} wideLabel />
    {#if plays !== undefined}
      <CountStat
        icon={IconCheck}
        size="lg"
        value={toGroupedNumber(plays)}
        label={countText.word({ count: plays, unit: 'playsTitle' })}
        wideLabel
      />
    {/if}
  {/snippet}
  {#snippet options()}
    <SingleSortMenu label={m.button_text_sort_watched_date()} />
  {/snippet}
  {#snippet end()}
    <DividersToggle {dividers} />
  {/snippet}
</SubnavToolbar>
