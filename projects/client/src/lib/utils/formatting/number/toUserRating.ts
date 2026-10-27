import type { StarRating } from '$lib/models/StarRating.ts';
import { toHumanNumber } from './toHumanNumber.ts';

const MAX_RATING = 10;

const STAR_RATINGS: ReadonlyArray<StarRating> = [
  { index: 1, value: 2, range: { min: 0, max: 2 } },
  { index: 2, value: 4, range: { min: 2, max: 4 } },
  { index: 3, value: 6, range: { min: 4, max: 6 } },
  { index: 4, value: 8, range: { min: 6, max: 8 } },
  { index: 5, value: 10, range: { min: 8, max: 10 } },
] as const;

export function toUserRating(rating: number, locale = 'en') {
  const factor = MAX_RATING / STAR_RATINGS.length;

  const starRating = rating / factor;

  return toHumanNumber(starRating, locale);
}
