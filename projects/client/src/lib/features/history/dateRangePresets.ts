import type { DateRangePreset } from '$lib/components/forms/DateRangePopoverProps.ts';
import * as m from '$lib/features/i18n/messages.ts';
import { formatLocalDate } from '$lib/utils/date/formatLocalDate.ts';
import { subtractDays } from '$lib/utils/date/subtractDays.ts';

export function dateRangePresets(today: Date): ReadonlyArray<DateRangePreset> {
  const year = today.getFullYear();
  const month = today.getMonth();
  const end = formatLocalDate(today);

  return [
    {
      key: 'last-7-days',
      label: m.button_text_range_last_7_days(),
      start: formatLocalDate(subtractDays(today, 6)),
      end,
    },
    {
      key: 'last-30-days',
      label: m.button_text_range_last_30_days(),
      start: formatLocalDate(subtractDays(today, 29)),
      end,
    },
    {
      key: 'this-month',
      label: m.text_this_month(),
      start: formatLocalDate(new Date(year, month, 1)),
      end,
    },
    {
      key: 'last-month',
      label: m.button_text_range_last_month(),
      start: formatLocalDate(new Date(year, month - 1, 1)),
      end: formatLocalDate(new Date(year, month, 0)),
    },
    {
      key: 'this-year',
      label: m.text_this_year(),
      start: formatLocalDate(new Date(year, 0, 1)),
      end,
    },
  ];
}
