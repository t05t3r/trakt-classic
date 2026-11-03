import { LIST_TYPES } from '$lib/features/lists/LIST_TYPES.ts';
import { toListTypeSegment } from '$lib/features/lists/toListTypeSegment.ts';

export const WATCHLIST_SEGMENTS = [null, ...LIST_TYPES.watchlist].map((type) =>
  toListTypeSegment(type)
);
