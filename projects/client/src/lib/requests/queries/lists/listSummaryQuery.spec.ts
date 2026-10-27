import { useQuery } from '$lib/features/query/useQuery.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { SiloListsMappedMock } from '$mocks/data/summary/shows/silo/mapped/SiloListsMappedMock.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { observeInvalidation } from '$test/beds/query/observeInvalidation.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { describe, expect, it } from 'vitest';
import { listSummaryQuery } from './listSummaryQuery.ts';

describe('listSummaryQuery', () => {
  it('should query user list summary', async () => {
    const result = await runQuery({
      factory: () =>
        createTestBedQuery(
          listSummaryQuery({
            listId: `${assertDefined(SiloListsMappedMock.at(0)).id}`,
          }),
        ),
      mapper: (response) => response?.data,
    });

    expect(result).to.deep.equal(SiloListsMappedMock.at(0));
  });

  it('should refetch when an item is listed', async () => {
    const invalidate = await observeInvalidation(() =>
      useQuery(listSummaryQuery({
        listId: `${assertDefined(SiloListsMappedMock.at(0)).id}`,
      }))
    );

    const requests = await invalidate(InvalidateAction.Listed);

    expect(requests).toEqual([
      `GET /lists/${assertDefined(SiloListsMappedMock.at(0)).id}`,
    ]);
  });
});
