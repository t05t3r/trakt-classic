import { LIST_TYPES } from '$lib/features/lists/LIST_TYPES.ts';
import {
  type ListTypeSegment,
  toListTypeSegment,
} from '$lib/features/lists/toListTypeSegment.ts';

export type RatingsTypeFilter = ListTypeSegment<'watchlist'>;

export const RATINGS_TYPES: ReadonlyArray<RatingsTypeFilter> = LIST_TYPES
  .watchlist.map((type) => toListTypeSegment(type));
