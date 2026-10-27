import type { Snippet } from 'svelte';

export type PosterGridColumns = Readonly<{
  desktop: number;
  tabletLarge: number;
  tabletSmall: number;
  mobile: number;
}>;

export type PosterGridProps<T> = {
  items: ReadonlyArray<T>;
  key: (item: T) => string | number;
  item: Snippet<[T]>;
  // The 1px divider between a phone row's two posters.
  phoneDivider?: 'default' | 'none';
  // The 20px above each cell and below the grid; 'none' sets the rows flush.
  gaps?: 'default' | 'none';
  // 'none' stacks the rows flush at phone width; the grid keeps 20px above them.
  phoneGaps?: 'default' | 'none';
  // Cells past this index are hidden at tablet width, as Classic's related row.
  tabletLimit?: number;
  // Omitted, the grid takes the global poster column counts.
  columns?: PosterGridColumns;
};
