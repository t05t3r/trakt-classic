import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { ShowSiloSeasonEpisodesMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonEpisodesMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { type EpisodesSort, sortEpisodes } from './sortEpisodes.ts';

const FIRST = assertDefined(ShowSiloSeasonEpisodesMappedMock.at(0));

function episode(
  { number, airDate = MAX_DATE, rating = null, votes = null }: {
    number: number;
    airDate?: Date;
    rating?: number | null;
    votes?: number | null;
  },
): EpisodeEntry {
  return {
    ...FIRST,
    id: number,
    key: `episode-${number}`,
    number,
    airDate,
    rating,
    votes,
  };
}

function numbersOf(
  { episodes, sort }: {
    episodes: ReadonlyArray<EpisodeEntry>;
    sort: EpisodesSort;
  },
) {
  return sortEpisodes({ items: episodes, sort }).map(({ number }) => number);
}

describe('sortEpisodes', () => {
  it('should sort by number, lowest first', () => {
    const episodes = [
      episode({ number: 2 }),
      episode({ number: 3 }),
      episode({ number: 1 }),
    ];

    expect(numbersOf({ episodes, sort: { by: 'number', how: 'asc' } }))
      .toEqual([1, 2, 3]);
  });

  it('should sort by air date, latest first, with an unknown or Invalid Date last', () => {
    const episodes = [
      episode({ number: 3, airDate: new Date('2023-05-19T01:00:00.000Z') }),
      episode({ number: 5 }),
      episode({ number: 1, airDate: new Date('2023-05-05T01:00:00.000Z') }),
      episode({ number: 4, airDate: new Date('not a date') }),
      episode({ number: 2, airDate: new Date('2023-05-12T01:00:00.000Z') }),
    ];

    expect(numbersOf({ episodes, sort: { by: 'aired', how: 'desc' } }))
      .toEqual([3, 2, 1, 5, 4]);
  });

  it('should sort by rating, lowest first, with a rating of 0 before an unrated episode last', () => {
    const episodes = [
      episode({ number: 1, rating: 0.7 }),
      episode({ number: 2 }),
      episode({ number: 3, rating: 0.9 }),
      episode({ number: 4, rating: 0 }),
    ];

    expect(numbersOf({ episodes, sort: { by: 'rating', how: 'asc' } }))
      .toEqual([4, 1, 3, 2]);
  });

  it('should sort by votes, most first, with no votes last', () => {
    const episodes = [
      episode({ number: 1, votes: 4288 }),
      episode({ number: 2 }),
      episode({ number: 3, votes: 3735 }),
    ];

    expect(numbersOf({ episodes, sort: { by: 'votes', how: 'desc' } }))
      .toEqual([1, 3, 2]);
  });
});
