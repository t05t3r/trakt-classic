import type { FilterParam } from '../models/FilterParams.ts';
import type { LimitParams } from '../models/LimitParams.ts';

type RecommendedProps = LimitParams & {
  filterParams: DeepPartial<FilterParam> | undefined;
};

export function getRecommendedSearchParams(
  { limit, filterParams }: RecommendedProps,
) {
  const params = {
    extended: 'full,images',
    limit,
    ...filterParams,
    ignore_watchlisted: true,
  };

  const definedParams = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => [key, String(value)]);

  return new URLSearchParams(definedParams);
}
