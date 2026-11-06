import { RATING_VALUES } from '$lib/features/media-actions/RATING_VALUES.ts';
import { RATINGS_TYPES } from '$lib/features/ratings/RATINGS_TYPES.ts';
import { pickSegment } from '$lib/utils/url/pickSegment.ts';

export function toRatingsFilters(filters: string) {
  return {
    type: pickSegment({ value: filters, position: 0, values: RATINGS_TYPES }),
    rating: pickSegment({ value: filters, position: 1, values: RATING_VALUES }),
  };
}
