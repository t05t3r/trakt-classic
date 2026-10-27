import type { MarkAsWatchedAt } from '$lib/models/MarkAsWatchedAt.ts';
import type { ExtendedMediaStoreProps } from '$lib/models/MediaStoreProps.ts';

type WatchedPayload = {
  ids: { trakt: number };
  watched_at: string | undefined;
};

type WatchedNumberedPayload = {
  number: number;
  watched_at?: string;
};

type WatchedSeasonsPayload = WatchedNumberedPayload & {
  episodes?: WatchedNumberedPayload[];
};

type WatchedShowPayload = WatchedPayload & {
  seasons?: WatchedSeasonsPayload[];
};

type MoviesPayload = { movies: WatchedPayload[] };
type ShowsPayload = { shows: WatchedShowPayload[] };
type SeasonsPayload = { seasons: WatchedPayload[] };
type EpisodesPayload = { episodes: WatchedPayload[] };

type MediaTypeMap =
  | MoviesPayload
  | ShowsPayload
  | SeasonsPayload
  | EpisodesPayload;

export function toMarkAsWatchedPayload(
  target: ExtendedMediaStoreProps,
  watchedAt?: MarkAsWatchedAt,
): MediaTypeMap {
  const watchedAtText = watchedAt instanceof Date
    ? watchedAt.toISOString()
    : watchedAt;

  if (target.type === 'show') {
    const shows = Array.isArray(target.media) ? target.media : [target.media];
    return {
      shows: shows.map(({ id, seasons }) => ({
        ids: { trakt: id },
        watched_at: !seasons ? watchedAtText : undefined,
        seasons: seasons?.map((season) => ({
          number: season.number,
          episodes: season.episodes.map((episode) => ({
            number: episode.number,
            watched_at: episode.watched_at ?? watchedAtText,
          })),
        })),
      })),
    };
  }

  const media = Array.isArray(target.media) ? target.media : [target.media];
  const payload = media.map(({ id }) => ({
    ids: { trakt: id },
    watched_at: watchedAtText,
  }));

  switch (target.type) {
    case 'movie':
      return { movies: payload };
    case 'season':
      return { seasons: payload };
    case 'episode':
      return { episodes: payload };
  }
}
