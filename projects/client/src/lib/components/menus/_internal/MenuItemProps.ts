import type { Snippet } from 'svelte';
import type { MenuCheckState } from './MenuCheckState.ts';

type MenuItemBase = {
  closeOnSelect?: boolean;
  children: Snippet;
};

export type MenuItemProps =
  & MenuItemBase
  & (
    | {
      onSelect: () => void;
      // Given, the item is a checkbox item; `'unknown'` while its state loads.
      checked?: MenuCheckState;
      radio?: never;
    }
    | {
      // Given, the item is a row of the enclosing `MenuRadioGroup`.
      radio: string;
      onSelect?: never;
      checked?: never;
    }
  );
