import type { PosterGridProps } from './PosterGridProps.ts';

// The grid holds the hidden days itself, so a caller resets them by keying it with `{#key}`.
export type DividedPosterGridProps<T> =
  & Pick<
    PosterGridProps<T>,
    'items' | 'key' | 'item' | 'columns' | 'phoneDivider'
  >
  & {
    dayOf: (item: T) => Date;
    // Left out, the dividers show no time spent.
    minutesOf?: (item: T) => number;
    // Off, the items run on in one grid.
    divided: boolean;
  };
