<script lang="ts">
  import CountStat from '$lib/components/stats/CountStat.svelte';
  import {
    HISTORY_TYPES,
    type HistoryType,
  } from '$lib/features/history/HISTORY_TYPES.ts';
  import RenderFor from '$lib/guards/RenderFor.svelte';
  import { countText } from '$lib/utils/formatting/number/countText.ts';
  import { toGroupedNumber } from '$lib/utils/formatting/number/toGroupedNumber.ts';
  import IconCheck from '@tabler/icons-svelte/icons/check';
  import DateRangeButton from './_internal/DateRangeButton.svelte';
  import DividersToggle from './_internal/DividersToggle.svelte';
  import type { HistoryToolbarProps } from './_internal/HistoryToolbarProps.ts';
  import ItemCountStat from './_internal/ItemCountStat.svelte';
  import { toTypeChoices } from './_internal/toTypeChoices.ts';
  import { thenChoose } from './_internal/thenChoose.ts';
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

  const isTypeChanged = $derived($type !== 'all');

  const selectType = (value: HistoryType | null) =>
    params.setType(value ?? 'all');
</script>

<SubnavToolbar {controls} changed={isTypeChanged}>
  {#snippet start()}
    <TypeMenu
      value={$type === 'all' ? null : $type}
      choices={TYPE_CHOICES}
      onChange={thenChoose(controls, selectType)}
      onRepick={$item
        ? thenChoose(controls, () => params.setType($type))
        : controls.close}
    />
    <RenderFor audience="all" device={['tablet-sm', 'tablet-lg', 'desktop']}>
      <DateRangeButton {params} />
    </RenderFor>
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
  {#snippet end()}
    <!-- Phones keep the date range out of the gear's panel. -->
    <RenderFor audience="all" device={['mobile']}>
      <DateRangeButton {params} />
    </RenderFor>
    <DividersToggle {dividers} />
  {/snippet}
</SubnavToolbar>
