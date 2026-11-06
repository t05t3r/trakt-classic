<script lang="ts">
  import DropdownButton from '$lib/components/buttons/DropdownButton.svelte';
  import DateRangePopover from '$lib/components/forms/DateRangePopover.svelte';
  import { dateRangePresets } from '$lib/features/history/dateRangePresets.ts';
  import type { HistoryParams } from '$lib/features/history/stores/useHistoryParams.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import type { DateRangeDays } from '$lib/models/DateRangeDays.ts';
  import { hasDateRange } from '$lib/utils/date/hasDateRange.ts';
  import { parseLocalDate } from '$lib/utils/date/parseLocalDate.ts';
  import { toDateRangeDays } from '$lib/utils/date/toDateRangeDays.ts';
  import { toHumanPatternDate } from '$lib/utils/formatting/date/toHumanPatternDate.ts';
  import IconCalendar from '@tabler/icons-svelte/icons/calendar';

  const { params }: { params: HistoryParams } = $props();

  const range = $derived(params.range);
  const days = $derived(toDateRangeDays($range));

  let open = $state(false);
  // Read per open, so a page left open past midnight gets today's presets.
  const presets = $derived(open ? dateRangePresets(new Date()) : []);

  const toShownDay = (day: string) =>
    toHumanPatternDate(parseLocalDate(day), 'd MMM yyyy');

  const toRangeText = ({ start, end }: DateRangeDays) => {
    if (start && end) {
      return m.text_date_range_from_to({
        from: toShownDay(start),
        to: toShownDay(end),
      });
    }
    if (start) return m.text_date_range_since({ from: toShownDay(start) });
    if (end) return m.text_date_range_until({ to: toShownDay(end) });

    return null;
  };

  const rangeText = $derived(toRangeText(days));
</script>

<span class="trakt-date-range-button">
  <DateRangePopover
    label={m.button_label_date_range()}
    {presets}
    value={days}
    onApply={params.setRange}
    onClear={params.clearRange}
    bind:open
  >
    {#snippet trigger({ props })}
      <DropdownButton
        {...props}
        label={rangeText
        ? m.button_label_date_range_active({ range: rangeText })
        : m.button_label_date_range()}
        title={rangeText ?? m.button_label_date_range()}
        variant="icon"
        selected={hasDateRange($range)}
        selectedTint="accent"
      >
        <IconCalendar class="date-range-glyph" aria-hidden="true" />
      </DropdownButton>
    {/snippet}
  </DateRangePopover>
</span>

<style lang="scss">
  .trakt-date-range-button {
    display: inline-flex;
    margin-block-start: var(--ni-neg-2);

    :global(.date-range-glyph) {
      width: var(--icon-size-sort-direction);
      height: var(--icon-size-sort-direction);
      stroke-width: var(--icon-stroke-chrome);
    }
  }
</style>
