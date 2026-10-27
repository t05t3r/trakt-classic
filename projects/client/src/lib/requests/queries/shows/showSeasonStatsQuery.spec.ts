import { SeasonSiloMappedMock } from '$mocks/data/summary/seasons/silo/mapped/SeasonSiloMappedMock.ts';
import { SeasonSiloStatsMappedMock } from '$mocks/data/summary/seasons/silo/mapped/SeasonSiloStatsMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { describe, expect, it } from 'vitest';
import { showSeasonStatsQuery } from './showSeasonStatsQuery.ts';

describe('showSeasonStatsQuery', () => {
  it('should query the stats of Silo season 1', async () => {
    const result = await runQuery({
      factory: () =>
        createTestBedQuery(
          showSeasonStatsQuery({
            slug: ShowSiloMappedMock.slug,
            season: SeasonSiloMappedMock.number,
          }),
        ),
      mapper: (response) => response?.data,
    });

    expect(result).toEqual(SeasonSiloStatsMappedMock);
  });
});
