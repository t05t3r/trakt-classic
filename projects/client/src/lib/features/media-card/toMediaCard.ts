import type { Pathname } from '$app/types';
import type { PosterCardMedia } from '$lib/components/media/PosterCardProps.ts';
import type { QuickActionsTarget } from '$lib/features/media-actions/components/QuickActionsProps.ts';
import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
import type { MovieEntry } from '$lib/requests/models/MovieEntry.ts';
import type { Season } from '$lib/requests/models/Season.ts';
import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';
import { isValidDate } from '$lib/utils/date/isValidDate.ts';
import { seasonLabel } from '$lib/utils/intl/seasonLabel.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';

export type MediaCardInput =
  | { type: 'movie'; movie: MovieEntry; playedAt?: Date }
  | { type: 'show'; show: ShowEntry }
  | { type: 'season'; show: ShowEntry; season: Season }
  | {
    type: 'episode';
    show: ShowEntry;
    episode: EpisodeEntry;
    playedAt?: Date;
  };

type MediaCardKind = MediaCardInput['type'];

export type MediaCard<K extends MediaCardKind = MediaCardKind> = K extends
  MediaCardKind ?
    & {
      media: Extract<PosterCardMedia, { type: K }>;
      href: Pathname;
      showHref?: Pathname;
      rating: { value: number | Nil; earliestReleaseDate: Date };
    }
    & { target: Extract<QuickActionsTarget, { type: K }> }
  : never;

// A play proves the item was out by then, whatever its air date says.
function toPlayedAirDate(airDate: Date, playedAt: Date | undefined): Date {
  if (!playedAt || !isValidDate(playedAt)) return airDate;
  if (!isValidDate(airDate)) return playedAt;

  return playedAt < airDate ? playedAt : airDate;
}

export function toMediaCard<K extends MediaCardKind>(
  input: Extract<MediaCardInput, { type: K }>,
): MediaCard<K>;
export function toMediaCard(input: MediaCardInput): MediaCard {
  switch (input.type) {
    case 'movie': {
      const { movie } = input;
      return {
        media: {
          type: 'movie',
          title: movie.title,
          year: movie.year ?? undefined,
        },
        href: UrlBuilder.movie(movie.slug),
        target: {
          type: 'movie',
          id: movie.id,
          title: movie.title,
          airDate: toPlayedAirDate(movie.airDate, input.playedAt),
        },
        rating: {
          value: movie.rating,
          earliestReleaseDate: movie.effectiveReleaseDate,
        },
      };
    }
    case 'show': {
      const { show } = input;
      return {
        media: { type: 'show', title: show.title },
        href: UrlBuilder.show(show.slug),
        target: {
          type: 'show',
          id: show.id,
          title: show.title,
          slug: show.slug,
          airDate: show.airDate,
          episode: show.episode,
        },
        rating: {
          value: show.rating,
          earliestReleaseDate: show.effectiveReleaseDate,
        },
      };
    }
    case 'season': {
      const { season, show } = input;
      return {
        media: { type: 'season', show: show.title, number: season.number },
        href: UrlBuilder.season(show.slug, season.number),
        showHref: UrlBuilder.show(show.slug),
        target: {
          type: 'season',
          id: season.id,
          title: seasonLabel(season.number, show.title),
          number: season.number,
          episodes: season.episodes,
          airDate: season.airDate,
          show: { id: show.id, title: show.title },
        },
        // A season carries no effective release date of its own.
        rating: { value: season.rating, earliestReleaseDate: season.airDate },
      };
    }
    case 'episode': {
      const { episode, show } = input;
      return {
        media: {
          type: 'episode',
          show: show.title,
          season: episode.season,
          number: episode.number,
          title: episode.title,
        },
        href: UrlBuilder.episode(show.slug, episode.season, episode.number),
        showHref: UrlBuilder.show(show.slug),
        target: {
          type: 'episode',
          id: episode.id,
          title: episode.title,
          season: episode.season,
          number: episode.number,
          show: { id: show.id, title: show.title },
          airDate: toPlayedAirDate(episode.airDate, input.playedAt),
        },
        rating: {
          value: episode.rating,
          earliestReleaseDate: episode.effectiveReleaseDate,
        },
      };
    }
  }
}
