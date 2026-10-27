import type { MediaCrew } from '$lib/requests/models/MediaCrew.ts';

export const EMPTY_CREW: Readonly<MediaCrew> = {
  directors: [],
  writers: [],
  creators: [],
  cast: [],
  guestStars: [],
};
