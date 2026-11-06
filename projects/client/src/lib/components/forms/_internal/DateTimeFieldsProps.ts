import type { DateTimePopoverProps } from '../DateTimePopoverProps.ts';

export type DateTimeFieldsProps =
  & Pick<DateTimePopoverProps, 'label' | 'onApply'>
  & { onCancel: () => void };
