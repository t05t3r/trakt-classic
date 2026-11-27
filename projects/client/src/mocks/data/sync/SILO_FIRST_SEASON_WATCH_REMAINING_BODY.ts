import { SILO } from '$mocks/data/media-actions/SILO.ts';

// Watch remaining's add for Silo's first season with only its first two episodes watched.
export const SILO_FIRST_SEASON_WATCH_REMAINING_BODY = {
  shows: [{
    ids: { trakt: SILO.id },
    seasons: [{
      number: 1,
      episodes: [3, 4, 5, 6, 7, 8, 9, 10].map((number) => ({
        number,
        watched_at: 'now',
      })),
    }],
  }],
};
