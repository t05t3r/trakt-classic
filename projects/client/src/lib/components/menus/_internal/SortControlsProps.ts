import type { Snippet } from 'svelte';
import type { SortMenuProps } from './SortMenuProps.ts';

export type SortControlsProps<K extends string> =
  & Omit<SortMenuProps<K>, 'font'>
  & {
    // Turns the direction's arrow up.
    pressed: boolean;
    onReverse: () => void;
    // Grouped with the direction, after it.
    toggles?: Snippet;
    // Sets the controls in a heading's line rather than a toolbar's.
    size?: 'heading';
    // The sort or its direction is off the page's default.
    changed?: boolean;
  };
