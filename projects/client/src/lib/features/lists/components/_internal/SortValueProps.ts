import type { RatingStoreProps } from '$lib/features/media-actions/stores/useRating.ts';
import type { SortBy } from '$lib/models/SortBy.ts';
import type { ListEntry } from '$lib/features/lists/ListEntry.ts';

export type SortValueProps = {
  item: ListEntry;
  sortBy: SortBy;
  target: RatingStoreProps;
};
