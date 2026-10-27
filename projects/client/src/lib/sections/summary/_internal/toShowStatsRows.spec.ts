import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloPeopleMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloPeopleMappedMock.ts';
import { ShowSiloStudiosMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloStudiosMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { toShowStatsRows } from './toShowStatsRows.ts';

const SILO = {
  show: ShowSiloMappedMock,
  crew: ShowSiloPeopleMappedMock,
  studios: ShowSiloStudiosMappedMock,
};

function rowOf(key: string, input = SILO) {
  return toShowStatsRows(input).find((row) => row.key === key);
}

describe('toShowStatsRows', () => {
  it("should list the rows in Classic's order", () => {
    expect(toShowStatsRows(SILO).map((row) => row.label)).toEqual([
      'Airs',
      'Premiered',
      'Runtime',
      'Total Runtime',
      'Creator',
      'Country',
      'Languages',
      'Studios',
      'Genres',
    ]);
  });

  it('should read the premiere as a full day', () => {
    expect(rowOf('premiered')?.values).toEqual([
      { key: 'premiered', text: '5 May 2023' },
    ]);
  });

  it('should mark the air slot and the premiere as zoned', () => {
    expect(
      toShowStatsRows(SILO)
        .filter((row) => row.zoned)
        .map((row) => row.key),
    ).toEqual(['airs', 'premiered']);
  });

  it('should hand the runtime on in minutes', () => {
    expect(rowOf('runtime')?.values).toEqual([{ key: 'runtime', minutes: 60 }]);
  });

  it("should hand the total runtime on with the show's episode count", () => {
    const show = {
      ...ShowSiloMappedMock,
      totalRuntime: 2047,
      episode: { count: 40 },
    };

    expect(rowOf('total-runtime', { ...SILO, show })?.values).toEqual([
      { key: 'total-runtime', minutes: 2047, alt: '(40 episodes)' },
    ]);
  });

  it('should list only the crew with the Creator job as creators', () => {
    const crew = {
      ...ShowSiloPeopleMappedMock,
      creators: [
        ...ShowSiloPeopleMappedMock.creators,
        { key: 'hugh-howey', name: 'Hugh Howey', jobs: ['Novel'] },
      ],
    };

    expect(rowOf('creator', { ...SILO, crew })?.values).toEqual([
      { key: 'graham-yost', text: 'Graham Yost', href: '/people/graham-yost' },
    ]);
  });

  it('should skip each row whose value is empty', () => {
    const show = {
      ...ShowSiloMappedMock,
      airDate: MAX_DATE,
      airs: undefined,
      runtime: NaN,
      totalRuntime: NaN,
      country: undefined,
      languages: [],
      genres: [],
    };
    const crew = { ...ShowSiloPeopleMappedMock, creators: [] };

    expect(toShowStatsRows({ show, crew, studios: [] })).toEqual([]);
  });
});
