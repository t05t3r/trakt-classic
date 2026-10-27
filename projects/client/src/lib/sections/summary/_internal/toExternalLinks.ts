import * as m from '$lib/features/i18n/messages.ts';
import type { ExternalLink } from '$lib/sections/summary/SummaryInfoProps.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';

type MediaIds = {
  homepage?: HttpsUrl | Nil;
  imdbId?: string | Nil;
  tmdbId?: number | Nil;
  type: 'movie' | 'show';
};

type EpisodeIds = {
  imdbId?: string | Nil;
  // The show's id, since TMDB addresses an episode under its show.
  tmdbId?: number | Nil;
  type: 'episode';
  season: number;
  episode: number;
};

// Both ids are the show's, since IMDb and TMDB address a season under its show.
type SeasonIds = {
  imdbId?: string | Nil;
  tmdbId?: number | Nil;
  type: 'season';
  season: number;
};

type ExternalIds = MediaIds | SeasonIds | EpisodeIds;

function toImdbHref(ids: ExternalIds, imdbId: string): string {
  if (ids.type === 'season') {
    return UrlBuilder.external.imdb.season(imdbId, ids.season);
  }

  return UrlBuilder.external.imdb.media(imdbId);
}

function toTmdbHref(ids: ExternalIds, tmdbId: string): string {
  switch (ids.type) {
    case 'movie':
      return UrlBuilder.external.tmdb.media(tmdbId, 'movie');
    case 'show':
      return UrlBuilder.external.tmdb.media(tmdbId, 'tv');
    case 'season':
      return UrlBuilder.external.tmdb.season({
        id: tmdbId,
        season: ids.season,
      });
    case 'episode':
      return UrlBuilder.external.tmdb.episode({
        id: tmdbId,
        season: ids.season,
        episode: ids.episode,
      });
    default:
      return ids satisfies never;
  }
}

export function toExternalLinks(
  ids: ExternalIds,
): ReadonlyArray<ExternalLink> {
  const { imdbId, tmdbId } = ids;
  const homepage = ids.type === 'movie' || ids.type === 'show'
    ? ids.homepage
    : null;

  const official: ReadonlyArray<ExternalLink> = homepage
    ? [{
      key: 'official',
      label: m.text_external_official_site(),
      href: homepage,
    }]
    : [];
  const imdb: ReadonlyArray<ExternalLink> = imdbId
    ? [{
      key: 'imdb',
      label: m.text_rating_source_imdb(),
      href: toImdbHref(ids, imdbId),
    }]
    : [];
  const tmdb: ReadonlyArray<ExternalLink> = tmdbId == null ? [] : [{
    key: 'tmdb',
    label: m.text_rating_source_tmdb(),
    href: toTmdbHref(ids, String(tmdbId)),
  }];

  return [...official, ...imdb, ...tmdb];
}
