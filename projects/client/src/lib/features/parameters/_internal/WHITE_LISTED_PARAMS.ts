import { FILTER_KEYS } from '$lib/features/filters/filterKeys.ts';

export const WHITE_LISTED_PARAMS: ReadonlyArray<string> = [
  'navigation',
  'mode',
  ...FILTER_KEYS,
];
