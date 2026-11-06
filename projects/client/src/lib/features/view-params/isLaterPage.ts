import { FIRST_PAGE } from '$lib/utils/FIRST_PAGE.ts';
import { isPositiveIntegerText } from '$lib/utils/number/isPositiveIntegerText.ts';

// Page 1 is the URL without a page, so only a later page is a value.
export const isLaterPage = (value: string) =>
  isPositiveIntegerText(value) && value !== String(FIRST_PAGE);
