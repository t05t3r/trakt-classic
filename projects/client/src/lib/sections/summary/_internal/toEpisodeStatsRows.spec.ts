import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { EpisodeSiloMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloMappedMock.ts';
import { EpisodeSiloPeopleMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloPeopleMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { toEpisodeStatsRows } from './toEpisodeStatsRows.ts';

const SILO_PILOT = {
  episode: EpisodeSiloMappedMock,
  show: ShowSiloMappedMock,
  crew: EpisodeSiloPeopleMappedMock,
};

function rowOf(key: string, input = SILO_PILOT) {
  return toEpisodeStatsRows(input).find((row) => row.key === key);
}

describe('toEpisodeStatsRows', () => {
  it("should list the rows in Classic's order", () => {
    expect(toEpisodeStatsRows(SILO_PILOT).map((row) => row.label)).toEqual([
      'Aired',
      'Runtime',
      'Director',
      'Writers',
      'Country',
      'Languages',
      'Genres',
    ]);
  });

  it("should read the first airing with its time, on the show's network", () => {
    expect(rowOf('aired')?.values).toEqual([
      { key: 'aired', text: '5 May 2023 01:00 on Apple TV+' },
    ]);
  });

  it('should read the first airing alone when the show has no network', () => {
    const show = { ...ShowSiloMappedMock, network: null };

    expect(rowOf('aired', { ...SILO_PILOT, show })?.values).toEqual([
      { key: 'aired', text: '5 May 2023 01:00' },
    ]);
  });

  it('should mark only the first airing as zoned', () => {
    expect(
      toEpisodeStatsRows(SILO_PILOT)
        .filter((row) => row.zoned)
        .map((row) => row.key),
    ).toEqual(['aired']);
  });

  it("should hand the episode's runtime on in minutes", () => {
    const episode = { ...EpisodeSiloMappedMock, runtime: 54 };

    expect(rowOf('runtime', { ...SILO_PILOT, episode })?.values).toEqual([
      { key: 'runtime', minutes: 54 },
    ]);
  });

  it('should list only the crew with the Director job as directors', () => {
    const crew = {
      ...EpisodeSiloPeopleMappedMock,
      directors: [
        ...EpisodeSiloPeopleMappedMock.directors,
        {
          key: 'jane-doe',
          name: 'Jane Doe',
          jobs: ['First Assistant Director'],
        },
      ],
    };

    expect(rowOf('director', { ...SILO_PILOT, crew })?.values).toEqual([
      {
        key: 'morten-tyldum',
        text: 'Morten Tyldum',
        href: '/people/morten-tyldum',
      },
    ]);
  });

  it("should list the episode's writers", () => {
    expect(rowOf('writers')?.values).toEqual([
      { key: 'graham-yost', text: 'Graham Yost', href: '/people/graham-yost' },
    ]);
  });

  it("should name the show's country, languages and genres", () => {
    const texts = (key: string) =>
      rowOf(key)?.values.map((value) => 'text' in value && value.text);

    expect(texts('country')).toEqual(['United States']);
    expect(texts('languages')).toEqual(['English']);
    expect(texts('genres')).toEqual(['Drama', 'Science Fiction']);
  });

  it('should skip each row whose value is empty', () => {
    const episode = {
      ...EpisodeSiloMappedMock,
      airDate: MAX_DATE,
      runtime: 0,
    };
    const show = {
      ...ShowSiloMappedMock,
      country: undefined,
      languages: [],
      genres: [],
    };
    const crew = {
      ...EpisodeSiloPeopleMappedMock,
      directors: [],
      writers: [],
    };

    expect(toEpisodeStatsRows({ episode, show, crew })).toEqual([]);
  });
});
