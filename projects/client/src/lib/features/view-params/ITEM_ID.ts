import { isPositiveIntegerText } from '$lib/utils/number/isPositiveIntegerText.ts';

// Trakt's ids start at 1, and a read takes an id of 0 as no id.
export const ITEM_ID = {
  values: isPositiveIntegerText,
  fallback: null,
} as const;
