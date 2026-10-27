import type { Snippet } from 'svelte';

export type MenuRadioGroupProps = {
  // `null` checks no row.
  value: string | null;
  // Selecting the checked row reports `null`; a group that needs a row
  // checked ignores it.
  onValueChange: (value: string | null) => void;
  // `MenuItem`s with `radio` set.
  children: Snippet;
};
