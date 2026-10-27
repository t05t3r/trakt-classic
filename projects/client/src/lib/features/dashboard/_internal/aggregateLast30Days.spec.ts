import type { ActivityHistory } from '$lib/requests/queries/users/activityHistoryQuery.ts';
import { EpisodeSiloMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloMappedMock.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { setTimeZone } from '$test/beds/date/setTimeZone.ts';
import { describe, expect, it } from 'vitest';
import { aggregateLast30Days } from './aggregateLast30Days.ts';

const START = new Date('2025-01-01T00:00:00.000Z');
const DAYS = 3;

type EpisodePlayParams = {
  playId: number;
  watchedAt: string;
  episodeId?: number;
  showId?: number;
  runtime?: number;
  showRuntime?: number;
  genres?: ReadonlyArray<string>;
};

function episodePlay(
  {
    playId,
    watchedAt,
    episodeId = 1,
    showId = 10,
    runtime = 60,
    showRuntime = 45,
    genres = ['drama'],
  }: EpisodePlayParams,
): ActivityHistory {
  return {
    id: playId,
    key: `episode-${playId}`,
    watchedAt: new Date(watchedAt),
    type: 'episode',
    episode: { ...EpisodeSiloMappedMock, id: episodeId, runtime },
    show: {
      ...ShowSiloMappedMock,
      id: showId,
      runtime: showRuntime,
      genres: [...genres],
    },
  };
}

type MoviePlayParams = {
  playId: number;
  watchedAt: string;
  movieId?: number;
  runtime?: number;
  genres?: ReadonlyArray<string>;
};

function moviePlay(
  { playId, watchedAt, movieId = 100, runtime = 120, genres = ['horror'] }:
    MoviePlayParams,
): ActivityHistory {
  return {
    id: playId,
    key: `movie-${playId}`,
    watchedAt: new Date(watchedAt),
    type: 'movie',
    movie: {
      ...MovieHereticMappedMock,
      id: movieId,
      runtime,
      genres: [...genres],
    },
  };
}

function aggregate(entries: ReadonlyArray<ActivityHistory>) {
  return aggregateLast30Days({ entries, start: START, days: DAYS });
}

describe('aggregateLast30Days', () => {
  it("should give each day of the window, from its start, the minutes of that day's plays", () => {
    const { days } = aggregate([
      episodePlay({ playId: 1, watchedAt: '2025-01-02T21:00:00.000Z' }),
      moviePlay({ playId: 2, watchedAt: '2025-01-02T08:00:00.000Z' }),
    ]);

    expect(days.map(({ key, date, minutes }) => ({ key, date, minutes })))
      .toEqual([
        {
          key: '2025-01-01',
          date: new Date('2025-01-01T00:00:00.000Z'),
          minutes: 0,
        },
        {
          key: '2025-01-02',
          date: new Date('2025-01-02T00:00:00.000Z'),
          minutes: 180,
        },
        {
          key: '2025-01-03',
          date: new Date('2025-01-03T00:00:00.000Z'),
          minutes: 0,
        },
      ]);
  });

  it('should put a play on its local day east of UTC', () => {
    setTimeZone('Asia/Tokyo');

    // Half past midnight on 2 January in Tokyo, still 1 January in UTC.
    const { days } = aggregateLast30Days({
      entries: [
        episodePlay({ playId: 1, watchedAt: '2025-01-01T15:30:00.000Z' }),
      ],
      start: new Date(2025, 0, 1),
      days: 2,
    });

    expect(days.map(({ key, minutes }) => ({ key, minutes }))).toEqual([
      { key: '2025-01-01', minutes: 0 },
      { key: '2025-01-02', minutes: 60 },
    ]);
  });

  it("should count each day's distinct episodes and movies beside their plays", () => {
    const { days } = aggregate([
      episodePlay({ playId: 1, watchedAt: '2025-01-03T01:00:00.000Z' }),
      episodePlay({ playId: 2, watchedAt: '2025-01-03T02:00:00.000Z' }),
      episodePlay({
        playId: 3,
        watchedAt: '2025-01-03T03:00:00.000Z',
        episodeId: 2,
      }),
      moviePlay({ playId: 4, watchedAt: '2025-01-03T04:00:00.000Z' }),
      moviePlay({
        playId: 5,
        watchedAt: '2025-01-01T05:00:00.000Z',
        movieId: 101,
      }),
    ]);

    expect(days.map(({ episodes, movies }) => ({ episodes, movies })))
      .toEqual([
        {
          episodes: { distinct: 0, plays: 0 },
          movies: { distinct: 1, plays: 1 },
        },
        {
          episodes: { distinct: 0, plays: 0 },
          movies: { distinct: 0, plays: 0 },
        },
        {
          episodes: { distinct: 2, plays: 3 },
          movies: { distinct: 1, plays: 1 },
        },
      ]);
  });

  it("should total the window's minutes, and its distinct episodes and movies beside their plays", () => {
    const { totals } = aggregate([
      episodePlay({ playId: 1, watchedAt: '2025-01-01T01:00:00.000Z' }),
      episodePlay({ playId: 2, watchedAt: '2025-01-02T01:00:00.000Z' }),
      episodePlay({
        playId: 3,
        watchedAt: '2025-01-02T02:00:00.000Z',
        episodeId: 2,
      }),
      moviePlay({ playId: 4, watchedAt: '2025-01-03T01:00:00.000Z' }),
    ]);

    expect(totals).toEqual({
      minutes: 300,
      episodes: { distinct: 2, plays: 3 },
      movies: { distinct: 1, plays: 1 },
    });
  });

  it('should drop the plays before the window and after its last day', () => {
    const { days, totals, genres } = aggregate([
      episodePlay({ playId: 1, watchedAt: '2024-12-31T23:59:59.000Z' }),
      moviePlay({ playId: 2, watchedAt: '2025-01-04T00:00:00.000Z' }),
      moviePlay({
        playId: 3,
        watchedAt: '2025-01-03T23:59:59.000Z',
        genres: ['comedy'],
      }),
    ]);

    expect(days.map(({ minutes }) => minutes)).toEqual([0, 0, 120]);
    expect(totals).toEqual({
      minutes: 120,
      episodes: { distinct: 0, plays: 0 },
      movies: { distinct: 1, plays: 1 },
    });
    expect(genres.map(({ slug }) => slug)).toEqual(['comedy']);
  });

  it("should share the genres by their tags, an episode's taken from its show, ties by slug", () => {
    const { genres } = aggregate([
      episodePlay({
        playId: 1,
        watchedAt: '2025-01-01T01:00:00.000Z',
        genres: ['drama', 'science-fiction'],
      }),
      episodePlay({
        playId: 2,
        watchedAt: '2025-01-02T01:00:00.000Z',
        genres: ['drama', 'science-fiction'],
      }),
      moviePlay({
        playId: 3,
        watchedAt: '2025-01-03T01:00:00.000Z',
        genres: ['thriller', 'drama'],
      }),
      moviePlay({
        playId: 4,
        watchedAt: '2025-01-03T02:00:00.000Z',
        genres: ['horror', 'comedy'],
      }),
    ]);

    expect(genres.map(({ slug, share }) => ({ slug, share }))).toEqual([
      { slug: 'drama', share: 0.375 },
      { slug: 'science-fiction', share: 0.25 },
      { slug: 'comedy', share: 0.125 },
      { slug: 'horror', share: 0.125 },
      { slug: 'thriller', share: 0.125 },
    ]);
  });

  it('should keep the ten genres with the most tags', () => {
    const { genres } = aggregate([
      moviePlay({
        playId: 1,
        watchedAt: '2025-01-01T01:00:00.000Z',
        genres: ['war', 'western', 'drama', 'action', 'adventure', 'anime'],
      }),
      moviePlay({
        playId: 2,
        watchedAt: '2025-01-01T02:00:00.000Z',
        genres: [
          'war',
          'western',
          'comedy',
          'crime',
          'fantasy',
          'history',
          'mystery',
          'romance',
        ],
      }),
    ]);

    expect(genres.map(({ slug }) => slug)).toEqual([
      'war',
      'western',
      'action',
      'adventure',
      'anime',
      'comedy',
      'crime',
      'drama',
      'fantasy',
      'history',
    ]);
  });

  it("should share a genre's tags over every tag, the genres past the tenth included", () => {
    const { genres } = aggregate([
      moviePlay({
        playId: 1,
        watchedAt: '2025-01-01T01:00:00.000Z',
        genres: [
          'war',
          'action',
          'adventure',
          'anime',
          'comedy',
          'crime',
          'drama',
          'fantasy',
          'history',
          'mystery',
          'romance',
        ],
      }),
      moviePlay({
        playId: 2,
        watchedAt: '2025-01-01T02:00:00.000Z',
        genres: ['war'],
      }),
    ]);

    expect(genres.at(0)?.share).toBe(1 / 6);
    expect(genres.at(-1)?.share).toBe(1 / 12);
  });

  it("should count each genre's distinct episodes, shows and movies beside their plays", () => {
    const { genres } = aggregate([
      episodePlay({ playId: 1, watchedAt: '2025-01-01T01:00:00.000Z' }),
      episodePlay({ playId: 2, watchedAt: '2025-01-01T02:00:00.000Z' }),
      episodePlay({
        playId: 3,
        watchedAt: '2025-01-02T01:00:00.000Z',
        episodeId: 2,
      }),
      episodePlay({
        playId: 4,
        watchedAt: '2025-01-02T02:00:00.000Z',
        episodeId: 3,
        showId: 11,
      }),
      moviePlay({
        playId: 5,
        watchedAt: '2025-01-03T01:00:00.000Z',
        genres: ['drama'],
      }),
      moviePlay({
        playId: 6,
        watchedAt: '2025-01-03T02:00:00.000Z',
        genres: ['drama'],
      }),
    ]);

    expect(genres).toEqual([
      {
        slug: 'drama',
        share: 1,
        episodes: { distinct: 3, plays: 4 },
        shows: 2,
        movies: { distinct: 1, plays: 2 },
      },
    ]);
  });

  describe('when a runtime is missing', () => {
    it("should count an episode play at its show's runtime", () => {
      const { days, totals } = aggregate([
        episodePlay({
          playId: 1,
          watchedAt: '2025-01-01T01:00:00.000Z',
          runtime: NaN,
          showRuntime: 45,
        }),
      ]);

      expect(days.at(0)?.minutes).toBe(45);
      expect(totals.minutes).toBe(45);
    });

    it('should count a play at no minutes when no runtime is known', () => {
      const { days, totals } = aggregate([
        episodePlay({
          playId: 1,
          watchedAt: '2025-01-01T01:00:00.000Z',
          runtime: NaN,
          showRuntime: NaN,
        }),
        moviePlay({
          playId: 2,
          watchedAt: '2025-01-01T02:00:00.000Z',
          runtime: NaN,
        }),
        moviePlay({
          playId: 3,
          watchedAt: '2025-01-01T03:00:00.000Z',
          movieId: 101,
        }),
      ]);

      expect(days.at(0)?.minutes).toBe(120);
      expect(totals).toEqual({
        minutes: 120,
        episodes: { distinct: 1, plays: 1 },
        movies: { distinct: 2, plays: 2 },
      });
    });
  });
});
