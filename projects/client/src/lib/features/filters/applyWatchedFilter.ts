import type { WatchedFilter } from './stores/useWatchedFilter.ts';

type ApplyWatchedFilterParams<T> = {
  items: ReadonlyArray<T>;
  filter: WatchedFilter | null;
  isWatched: (item: T) => boolean;
};

export function applyWatchedFilter<T>(
  { items, filter, isWatched }: ApplyWatchedFilterParams<T>,
): ReadonlyArray<{ item: T; isFaded: boolean }> {
  if (filter === 'hide') {
    return items
      .filter((item) => !isWatched(item))
      .map((item) => ({ item, isFaded: false }));
  }

  return items.map((item) => ({
    item,
    isFaded: filter === 'fade' && isWatched(item),
  }));
}
