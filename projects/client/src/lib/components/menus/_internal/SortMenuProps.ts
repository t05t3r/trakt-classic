import type { ChoiceMenuProps } from './ChoiceMenuProps.ts';

export type SortMenuProps<K extends string> =
  & Pick<ChoiceMenuProps<K>, 'choices' | 'onRepick' | 'font' | 'changed'>
  & {
    value: K;
    onSelect: (by: K) => void;
  };
