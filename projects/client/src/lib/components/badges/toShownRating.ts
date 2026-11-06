import { toTraktRating } from '$lib/utils/formatting/number/toTraktRating.ts';
import { isRatingShown, type IsRatingShownParams } from './isRatingShown.ts';

export function toShownRating(params: IsRatingShownParams) {
  if (!isRatingShown(params)) return null;

  return { value: params.rating, percent: toTraktRating(params.rating) };
}
