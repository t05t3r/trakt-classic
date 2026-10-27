import type { Snippet } from 'svelte';
import type { RowReveal } from '../RowReveal.ts';

export type RowRevealGridProps<T> = {
  items: ReadonlyArray<T>;
  key: (item: T) => string | number;
  columns: { desktop: number; tablet: number; mobile: number };
  rowMax: number;
  rowCount: number;
  reveal?: RowReveal;
  item: Snippet<[T]>;
  // 'none' leaves the stepping to a parent's own navigator, from `reveal`.
  navigator?: 'always' | 'mobile' | 'none';
  // Both are gutterless on phones. A posters grid draws a divider between
  // pairs, so its `columns.mobile` must be 2; a fanart grid draws none.
  variant?: 'posters' | 'fanart';
  // A poster grid's 20px below its cells, which a section with its own room drops.
  bottomGap?: 'default' | 'none';
  // Phone rows of `columns.mobile` cards, in place of the desktop count reflowed.
  phoneRows?: 'desktop' | 'mobile';
  // The 20px above each cell on phones; 'none' sets the rows flush, as Classic's phone grids.
  phoneCellGap?: 'default' | 'none';
  // Takes the focus from a collapsed cell or a removed cell, navigator or grid,
  // in place of the section that holds the grid.
  fallbackFocus?: (grid: HTMLElement) => HTMLElement | Nil;
};
