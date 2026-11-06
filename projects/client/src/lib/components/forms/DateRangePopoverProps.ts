import type { TriggerSnippet } from '$lib/components/menus/TriggerSnippet.ts';
import type { DateRangeDays } from '$lib/models/DateRangeDays.ts';

export type DateRangePreset = DateRangeDays & { key: string; label: string };

export type DateRangePopoverProps = {
  label: string;
  trigger: TriggerSnippet;
  presets: ReadonlyArray<DateRangePreset>;
  value: DateRangeDays;
  onApply: (days: DateRangeDays) => void;
  onClear: () => void;
  open?: boolean;
};
