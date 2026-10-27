import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { SeasonSiloMappedMock } from '$mocks/data/summary/seasons/silo/mapped/SeasonSiloMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { toSeasonStatsRows } from './toSeasonStatsRows.ts';

const SILO_SEASON_ONE = {
  season: SeasonSiloMappedMock,
  show: ShowSiloMappedMock,
};

function rowOf(key: string, input = SILO_SEASON_ONE) {
  return toSeasonStatsRows(input).find((row) => row.key === key);
}

describe('toSeasonStatsRows', () => {
  it("should list the rows in Classic's order", () => {
    expect(toSeasonStatsRows(SILO_SEASON_ONE).map((row) => row.label))
      .toEqual([
        'Premiered',
        'Runtime',
        'Total Runtime',
        'Country',
        'Languages',
        'Genres',
      ]);
  });

  it("should read the premiere as a full day on the show's network", () => {
    expect(rowOf('premiered')?.values).toEqual([
      { key: 'premiered', text: '5 May 2023 on Apple TV+' },
    ]);
  });

  it('should read the premiere alone when the show has no network', () => {
    const show = { ...ShowSiloMappedMock, network: null };

    expect(rowOf('premiered', { ...SILO_SEASON_ONE, show })?.values).toEqual([
      { key: 'premiered', text: '5 May 2023' },
    ]);
  });

  it('should mark only the premiere as zoned', () => {
    expect(
      toSeasonStatsRows(SILO_SEASON_ONE)
        .filter((row) => row.zoned)
        .map((row) => row.key),
    ).toEqual(['premiered']);
  });

  it("should hand the show's runtime on in minutes", () => {
    const show = { ...ShowSiloMappedMock, runtime: 54 };

    expect(rowOf('runtime', { ...SILO_SEASON_ONE, show })?.values).toEqual([
      { key: 'runtime', minutes: 54 },
    ]);
  });

  it("should hand the season's total runtime on with its episode count", () => {
    const season = {
      ...SeasonSiloMappedMock,
      totalRuntime: 519,
      episodes: { count: 10, aired: 8 },
    };

    expect(rowOf('total-runtime', { ...SILO_SEASON_ONE, season })?.values)
      .toEqual([{ key: 'total-runtime', minutes: 519, alt: '(10 episodes)' }]);
  });

  it("should name the show's country, languages and genres", () => {
    const texts = (key: string) =>
      rowOf(key)?.values.map((value) => 'text' in value && value.text);

    expect(texts('country')).toEqual(['United States']);
    expect(texts('languages')).toEqual(['English']);
    expect(texts('genres')).toEqual(['Drama', 'Science Fiction']);
  });

  it('should skip each row whose value is empty', () => {
    const season = {
      ...SeasonSiloMappedMock,
      airDate: MAX_DATE,
      totalRuntime: NaN,
    };
    const show = {
      ...ShowSiloMappedMock,
      runtime: NaN,
      country: undefined,
      languages: [],
      genres: [],
    };

    expect(toSeasonStatsRows({ season, show })).toEqual([]);
  });
});
