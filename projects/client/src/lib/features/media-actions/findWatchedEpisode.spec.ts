import type { WatchedEpisode } from '$lib/features/auth/queries/currentUserWatchedShowsQuery.ts';
import type { UserHistory } from '$lib/features/auth/stores/useCurrentUserHistory.ts';
import { describe, expect, it } from 'vitest';
import { findWatchedEpisode } from './findWatchedEpisode.ts';

const WATCHED_AT = new Date('2026-04-20T04:00:00.000Z');

const PILOT: WatchedEpisode = {
  episodeId: 101,
  season: 1,
  plays: 2,
  watchedAt: WATCHED_AT,
};

const FINALE: WatchedEpisode = {
  episodeId: 110,
  season: 1,
  plays: 1,
  watchedAt: WATCHED_AT,
};

const HISTORY: UserHistory = {
  movies: new Map(),
  shows: new Map([
    [7, {
      id: 7,
      watchedAt: WATCHED_AT,
      episodes: [PILOT, FINALE],
      watchedDates: [WATCHED_AT],
      playsPerSeason: new Map([[1, 3]]),
    }],
  ]),
};

describe('findWatchedEpisode', () => {
  it("should find the episode's entry in its show's history", () => {
    expect(findWatchedEpisode({ history: HISTORY, showId: 7, episodeId: 110 }))
      .toEqual(FINALE);
  });

  it('should find nothing for an episode of the show never watched', () => {
    expect(findWatchedEpisode({ history: HISTORY, showId: 7, episodeId: 102 }))
      .toBeUndefined();
  });

  it('should find nothing for a show never watched', () => {
    expect(findWatchedEpisode({ history: HISTORY, showId: 8, episodeId: 101 }))
      .toBeUndefined();
  });
});
