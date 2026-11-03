import type { UserHistory } from '$lib/features/auth/stores/useCurrentUserHistory.ts';
import { DEVS } from '$mocks/data/media-actions/DEVS.ts';
import { HERETIC_ACTIONS_TARGET } from '$mocks/data/media-actions/HERETIC_ACTIONS_TARGET.ts';
import { MATRIX_ACTIONS_TARGET } from '$mocks/data/media-actions/MATRIX_ACTIONS_TARGET.ts';
import { SILO_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_ACTIONS_TARGET.ts';
import { SILO_EPISODE_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_EPISODE_ACTIONS_TARGET.ts';
import { SILO_SEASON_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_SEASON_ACTIONS_TARGET.ts';
import { WatchedMoviesMappedMock } from '$mocks/data/users/mapped/WatchedMoviesMappedMock.ts';
import { WatchedShowsMappedMock } from '$mocks/data/users/mapped/WatchedShowsMappedMock.ts';
import { describe, expect, it } from 'vitest';
import {
  isWatchedInHistory,
  type WatchedInHistoryTarget,
} from './isWatchedInHistory.ts';

// Silo's history holds one play of 1x01; Devs's, all eight regular episodes.
const HISTORY: UserHistory = {
  movies: new Map(WatchedMoviesMappedMock.map((movie) => [movie.id, movie])),
  shows: new Map(WatchedShowsMappedMock.map((show) => [show.id, show])),
};

function siloSeason({ number, aired }: { number: number; aired: number }) {
  return {
    ...SILO_SEASON_ACTIONS_TARGET,
    number,
    episodes: { count: aired, aired },
  };
}

function isWatched(target: WatchedInHistoryTarget) {
  return isWatchedInHistory({ target, history: HISTORY });
}

describe('isWatchedInHistory', () => {
  describe('for movies', () => {
    it('should read a movie in the history as watched', () => {
      expect(isWatched(HERETIC_ACTIONS_TARGET)).toBe(true);
    });

    it('should read a movie off the history as unwatched', () => {
      expect(isWatched(MATRIX_ACTIONS_TARGET)).toBe(false);
    });
  });

  describe('for episodes', () => {
    it("should read an episode in its show's history as watched", () => {
      expect(isWatched(SILO_EPISODE_ACTIONS_TARGET)).toBe(true);
    });

    it("should read an episode off its show's history as unwatched", () => {
      expect(isWatched({ ...SILO_EPISODE_ACTIONS_TARGET, id: 2 })).toBe(false);
    });

    it('should read an episode of a show never watched as unwatched', () => {
      expect(
        isWatched({
          ...SILO_EPISODE_ACTIONS_TARGET,
          show: { id: MATRIX_ACTIONS_TARGET.id },
        }),
      ).toBe(false);
    });
  });

  describe('for seasons', () => {
    it('should read a season with fewer plays than aired episodes as unwatched', () => {
      expect(isWatched(SILO_SEASON_ACTIONS_TARGET)).toBe(false);
    });

    it('should read a season with as many plays as aired episodes as watched', () => {
      expect(isWatched(siloSeason({ number: 1, aired: 1 }))).toBe(true);
    });

    it('should read a season with more plays than aired episodes as watched', () => {
      expect(
        isWatched({
          ...siloSeason({ number: 1, aired: 7 }),
          show: { id: DEVS.id },
        }),
      ).toBe(true);
    });

    it('should read a season with no aired episodes as unwatched', () => {
      expect(isWatched(siloSeason({ number: 2, aired: 0 }))).toBe(false);
    });

    it('should read a season of a show never watched as unwatched', () => {
      expect(
        isWatched({
          ...SILO_SEASON_ACTIONS_TARGET,
          show: { id: MATRIX_ACTIONS_TARGET.id },
        }),
      ).toBe(false);
    });
  });

  describe('for shows', () => {
    it('should read a show with every regular episode played as watched', () => {
      expect(isWatched({ ...DEVS, episode: { count: 8 } })).toBe(true);
    });

    it('should read a show with episodes left to play as unwatched', () => {
      expect(isWatched(SILO_ACTIONS_TARGET)).toBe(false);
    });

    it('should read a show without an episode count as unwatched', () => {
      expect(isWatched(DEVS)).toBe(false);
    });
  });
});
