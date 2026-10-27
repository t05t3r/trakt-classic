import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { time } from '$lib/utils/timing/time.ts';
import type { SearchResultResponse } from '@trakt/api';
import z from 'zod';
import { mapToPersonSummary } from '$lib/requests/_internal/mapToPersonSummary.ts';
import type { CrewPosition } from '$lib/requests/models/CrewPosition.ts';
import {
  type PersonSummary,
  PersonSummarySchema,
} from '$lib/requests/models/PersonSummary.ts';

type SearchParams = {
  query: string;
  limit: number;
} & ApiParams;

const PeopleSearchResultSchema = z.object({
  type: z.literal('people'),
  items: PersonSummarySchema.array(),
});

export type PeopleSearchResult = z.infer<typeof PeopleSearchResultSchema>;

function isGarbage(value: PersonSummary): boolean {
  const relevantPositions: CrewPosition[] = [
    'directing',
    'acting',
    'writing',
    'production',
  ];

  return !relevantPositions.includes(value?.knownFor ?? 'unknown');
}

function mapToSearchResultEntry(
  item: SearchResultResponse,
) {
  const { type } = item;
  switch (type) {
    case 'person':
      return {
        score: item.score,
        ...mapToPersonSummary(assertDefined(item.person)),
      };
    default:
      throw new Error(`Unsupported type for people search: ${type}`);
  }
}

const searchRequest = async (
  { query, limit, fetch }: SearchParams,
) => {
  const queryParams = {
    query,
    limit,
  };

  return api({
    fetch,
    cancellable: true,
  })
    .search
    .query({
      query: {
        ...queryParams,
        extended: 'full,images',
      },
      params: { type: 'person' },
    });
};

export const searchPeopleQuery = defineQuery({
  key: 'searchPeople',
  invalidations: [],
  dependencies: (params) => [params.query, params.limit],
  request: searchRequest,
  mapper: (response) => ({
    type: 'people' as const,
    items: response
      .body
      .map(mapToSearchResultEntry)
      .filter((value) => !isGarbage(value)),
  }),
  schema: PeopleSearchResultSchema,
  ttl: time.minutes(30),
  retry: 0,
});
