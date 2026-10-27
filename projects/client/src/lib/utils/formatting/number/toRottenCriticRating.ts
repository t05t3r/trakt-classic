export type RottenTomatoRating = 'rotten' | 'fresh' | 'unrated';

export function toRottenCriticRating(
  rating?: number | Nil,
): RottenTomatoRating {
  if (!rating) {
    return 'unrated';
  }

  if (rating < 0.6) {
    return 'rotten';
  }

  return 'fresh';
}
