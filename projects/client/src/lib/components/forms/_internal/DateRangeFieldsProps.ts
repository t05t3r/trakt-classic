import type { DateRangePopoverProps } from '../DateRangePopoverProps.ts';

export type DateRangeFieldsProps = Pick<
  DateRangePopoverProps,
  'value' | 'onApply' | 'onClear'
>;
