import { SILO } from '$mocks/data/media-actions/SILO.ts';

// The body of a hide or an unhide of one of Silo's seasons in its progress.
export const siloSeasonBody = (number: number) => ({
  shows: [{ ids: { trakt: SILO.id }, seasons: [{ number }] }],
});
