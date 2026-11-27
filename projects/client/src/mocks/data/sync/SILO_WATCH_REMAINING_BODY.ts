import { SILO } from '$mocks/data/media-actions/SILO.ts';

// Watch remaining's add for Silo's progress mock, which leaves its second season's 2 to 7 unwatched.
export const SILO_WATCH_REMAINING_BODY = {
  shows: [{
    ids: { trakt: SILO.id },
    seasons: [{
      number: 2,
      episodes: [2, 3, 4, 5, 6, 7].map((number) => ({
        number,
        watched_at: 'now',
      })),
    }],
  }],
};
