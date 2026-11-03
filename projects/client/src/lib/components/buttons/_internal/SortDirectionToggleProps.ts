import type { IconToggleProps } from './IconToggleProps.ts';

// `pressed` also turns the arrow up.
export type SortDirectionToggleProps = Omit<
  IconToggleProps,
  'label' | 'children'
>;
