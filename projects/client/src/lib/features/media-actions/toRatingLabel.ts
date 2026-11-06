import * as m from '$lib/features/i18n/messages.ts';

const LABELS = [
  m.text_rating_1,
  m.text_rating_2,
  m.text_rating_3,
  m.text_rating_4,
  m.text_rating_5,
  m.text_rating_6,
  m.text_rating_7,
  m.text_rating_8,
  m.text_rating_9,
  m.text_rating_10,
];

export function toRatingLabel(rating: number): string {
  // `at` counts from the end for a negative index.
  if (rating < 1) return '';

  return LABELS.at(rating - 1)?.() ?? '';
}
