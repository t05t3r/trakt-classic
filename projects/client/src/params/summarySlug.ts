import type { ParamMatcher } from '@sveltejs/kit';

// Classic's list pages share the summary path, so their kinds never name a title.
const LIST_KINDS: ReadonlySet<string> = new Set([
  'trending',
  'popular',
  'anticipated',
  'recommendations',
  'boxoffice',
  'watched',
  'favorited',
]);

export const match: ParamMatcher = (param) => !LIST_KINDS.has(param);
