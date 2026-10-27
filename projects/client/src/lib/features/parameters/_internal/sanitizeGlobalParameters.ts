import { WHITE_LISTED_PARAMS } from './WHITE_LISTED_PARAMS.ts';

export function sanitizeGlobalParameters(params: URLSearchParams) {
  return Object.fromEntries(
    Array.from(params.entries()).filter(([key]) =>
      WHITE_LISTED_PARAMS.includes(key)
    ),
  );
}
