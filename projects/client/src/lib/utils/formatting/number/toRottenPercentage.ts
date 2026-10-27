import { languageTag } from '$lib/features/i18n/languageTag.ts';
import { toPercentage } from './toPercentage.ts';

export function toRottenPercentage(rating?: number | Nil) {
  if (!rating) {
    return;
  }

  return toPercentage(rating, languageTag());
}
