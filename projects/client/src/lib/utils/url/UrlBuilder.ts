import type { ExtendedMediaType } from '$lib/requests/models/ExtendedMediaType.ts';
import type { MediaType } from '$lib/requests/models/MediaType.ts';
import type { SearchParams } from '$lib/requests/models/SearchParams.ts';
import type { PersonalListType } from '$lib/models/PersonalListType.ts';
import type { DiscoverMode } from '$lib/features/filters/models/DiscoverMode.ts';
import type { CrewPositions } from '$lib/requests/models/CrewPosition.ts';
import type { LandingError } from '$lib/features/auth/models/LandingError.ts';
import { formatLocalDate } from '$lib/utils/date/formatLocalDate.ts';
import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
import { buildParamString } from './buildParamString.ts';

const SUPPORT_EMAIL = 'support@trakt.tv';

type TypeParams = {
  type: ExtendedMediaType | 'media';
};

type WellKnownQueryParams = {
  page?: number;
  watch_window?: number;
  status?: string;
  search?: string;
  display?: MediaType;
  library?: string;
  sort_by?: string;
  sort_how?: string;
  mode?: DiscoverMode;
  section?: string;
};

type DiscoverUrlParams = SearchParams & {
  mode?: DiscoverMode;
};

type LandingParams = {
  returnTo?: string;
  error?: LandingError;
};

type HistoryType = 'episodes' | 'shows' | 'movies';

type HistoryGenreParams = {
  type: HistoryType;
  genre: string;
  startAt: string;
};

type UrlBuilderParams =
  & TypeParams
  & Omit<WellKnownQueryParams, 'search'>
  & SearchParams;

function encodeRecord(
  params?: Record<string, string | number | boolean>,
): string | undefined {
  if (!params) {
    return undefined;
  }

  return encodeURIComponent(JSON.stringify(params));
}

function sanitizeParams(
  params: Omit<WellKnownQueryParams, 'search'> & SearchParams,
): WellKnownQueryParams {
  return {
    page: params.page,
    watch_window: params.watch_window,
    status: params.status,
    search: encodeRecord(params.search),
    display: params.display,
    sort_by: params.sort_by,
    sort_how: params.sort_how,
    mode: params.mode,
    section: params.section,
  };
}

// Keeps the path literal in the type, as SvelteKit's resolve() requires.
function withSearch<Path extends string>(
  path: Path,
  params: Record<string, string | Nil>,
): Path | `${Path}?${string}` {
  const search = buildParamString(params).slice(1);
  return search ? `${path}?${search}` : path;
}

const discoverDrilldownFactory =
  (category: string) => (params?: DiscoverUrlParams) => {
    const baseUrl = `/discover/${category}`;
    if (!params) {
      return baseUrl;
    }

    return baseUrl + buildParamString(sanitizeParams(params));
  };

const categoryDrilldownFactory =
  (category: string) => ({ type, ...params }: UrlBuilderParams) => {
    const baseUrl = `/${category}/${type}s`;
    return baseUrl + buildParamString(sanitizeParams(params));
  };

const listsDrilldownFactory = (user: string) => (type: PersonalListType) => {
  switch (type) {
    case 'collaboration':
      return `/users/${user}/lists/view/collaborations`;
    default:
      return `/users/${user}/lists/view/${type}`;
  }
};

type TmdbSeasonParams = {
  id: string;
  season: number;
};

const tmdbSeason = ({ id, season }: TmdbSeasonParams) =>
  `https://www.themoviedb.org/tv/${id}/season/${season}`;

const imdbSeason = (imdbId: string, season: number) => {
  const episodes = `https://www.imdb.com/title/${imdbId}/episodes`;
  if (season === SPECIALS) return episodes;

  return `${episodes}?season=${season}`;
};

const ogSupportFactory = (username?: string): HttpsUrl | MailToUrl => {
  const page = globalThis.location?.href ?? 'https://app.trakt.tv';
  const supportSubject = 'Trakt Support Request';
  const supportBody = 'Please describe your issue...';
  const supportDetails = username
    ? `**Username:** ${username}\n**Page:** ${page}`
    : `Page: ${page}`;

  const encodedBody = encodeURIComponent(
    `${supportBody}\n\n---\n\n${supportDetails}`,
  );

  if (!username) {
    return `mailto:${SUPPORT_EMAIL}?subject=${supportSubject}&body=${encodedBody}`;
  }

  return `https://forums.trakt.tv/new-message?username=support&title=${supportSubject}&body=${encodedBody}`;
};

export const UrlBuilder = {
  history: {
    home: (
      type?: HistoryType,
    ): '/users/me/history' | `/users/me/history/${HistoryType}` =>
      type ? `/users/me/history/${type}` : '/users/me/history',
    genre: ({ type, genre, startAt }: HistoryGenreParams) =>
      withSearch(`/users/me/history/${type}`, {
        genres: genre,
        start_at: startAt,
      }),
    day: (date: Date) =>
      withSearch('/users/me/history', {
        start_at: formatLocalDate(date),
        days: '1',
      }),
    sync: (syncId: number) =>
      `/history${buildParamString({ sync_id: syncId })}`,
    category: (params: UrlBuilderParams) => {
      return categoryDrilldownFactory('history')(params);
    },
    all: ({ page }: UrlBuilderParams) => {
      return `/history${buildParamString({ page })}`;
    },
    movie: (slug: string) => `/history/movies/${slug}`,
    show: (slug: string) => `/history/shows/${slug}`,
    episode: (showSlug: string, seasonNumber: number, episodeNumber: number) =>
      `/history/shows/${showSlug}/seasons/${seasonNumber}/episodes/${episodeNumber}`,
  },
  watched: (params: UrlBuilderParams) => {
    return categoryDrilldownFactory('watched')(params);
  },
  trending(params?: DiscoverUrlParams) {
    return discoverDrilldownFactory('trending')(params);
  },
  recommended: (type: MediaType): `/${MediaType}s/recommendations` =>
    `/${type}s/recommendations`,
  anticipated(params?: DiscoverUrlParams) {
    return discoverDrilldownFactory('anticipated')(params);
  },
  popular(params?: DiscoverUrlParams) {
    return discoverDrilldownFactory('popular')(params);
  },
  releases(params?: DiscoverUrlParams) {
    return discoverDrilldownFactory('releases')(params);
  },
  social: {
    activity: () => {
      return '/social/activity';
    },
  },
  progress: (): '/users/me/progress' => '/users/me/progress',
  ratings: (): '/users/me/ratings' => '/users/me/ratings',
  startWatching: (user: string, params: Record<string, string | number> = {}) =>
    `/users/${user}/start-watching${buildParamString(sanitizeParams(params))}`,

  landing: (params: LandingParams = {}) => withSearch('/', params),
  auth: {
    login: ({ returnTo }: { returnTo: string }) =>
      withSearch('/auth/login', { returnTo }),
    callback: (): '/auth/callback' => '/auth/callback',
    logout: (): '/auth/logout' => '/auth/logout',
    refresh: (): '/auth/refresh' => '/auth/refresh',
  },
  dashboard: (): '/dashboard' => '/dashboard',
  welcome: () => '/welcome',
  shows: (): '/shows' => '/shows',
  showsTrending: (): '/shows/trending' => '/shows/trending',
  discover: (): '/discover' => '/discover',
  media: (type: MediaType, id: string) => {
    switch (type) {
      case 'show':
        return UrlBuilder.show(id);
      case 'movie':
        return UrlBuilder.movie(id);
    }
  },
  search: (): '/search' => '/search',
  calendar: (): '/calendars' => '/calendars',
  show: (
    id: string,
    params: Record<string, string | number> = {},
  ): `/shows/${string}` => `/shows/${id}${buildParamString(params)}`,
  movies: () => '/movies',
  moviesTrending: (): '/movies/trending' => '/movies/trending',
  movie: (
    id: string,
    params: Record<string, string | number> = {},
  ): `/movies/${string}` => `/movies/${id}${buildParamString(params)}`,
  people: (id: string, positions?: CrewPositions): `/people/${string}` =>
    `/people/${id}${buildParamString(positions ?? {})}`,
  season: (id: string, season: number): `/shows/${string}/seasons/${number}` =>
    `/shows/${id}/seasons/${season}`,
  episode: (
    id: string,
    season: number,
    episode: number,
  ): `/shows/${string}/seasons/${number}/episodes/${number}` =>
    `/shows/${id}/seasons/${season}/episodes/${episode}`,
  credits: {
    movies: (slug: string) => `/people/${slug}/movies`,
    shows: (slug: string) => `/people/${slug}/shows`,
    history: (slug: string) => `/people/${slug}/history`,
  },
  related: {
    movie: (slug: string) => `/movies/${slug}/related`,
    show: (slug: string) => `/shows/${slug}/related`,
    episode: (slug: string, season: number, episode: number) =>
      `/shows/${slug}/seasons/${season}/episodes/${episode}/related`,
  },
  popularLists: {
    movie: (slug: string) => `/movies/${slug}/lists`,
    show: (slug: string) => `/shows/${slug}/lists`,
  },
  profile: {
    user: (username: string) => `/profile/${username}`,
    me: () => UrlBuilder.profile.user('me'),
    favorites: (username: string, params: Record<string, string> = {}) =>
      `/profile/${username}/favorites${
        buildParamString(sanitizeParams(params))
      }`,
    history: (username: string) => `/profile/${username}/history`,
    social: (username: string) => `/profile/${username}/social`,
    progress: (username: string, params: Record<string, string> = {}) =>
      `/profile/${username}/progress${
        buildParamString(sanitizeParams(params))
      }`,
  },
  users: (id: string) => ({
    lists: (
      slug: string,
      params: Record<string, string> = {},
    ): `/users/${string}/lists/${string}` =>
      `/users/${id}/lists/${slug}${
        buildParamString({ ...sanitizeParams(params) })
      }`,
    yearToDate: (year: number) => `/users/${id}/year/${year}`,
    allTime: () => `/users/${id}/year/all`,
    monthInReview: (year: number, month: number) =>
      `/users/${id}/mir/${year}/${month}`,
  }),
  library: {
    home: () => '/users/me/library',
    me: (library: string) => `/users/me/library?library=${library}`,
  },
  lists: {
    smart: {
      create: () => '/lists/smart/create',
      all: () => '/lists/smart/view',
      view: (slug: string) => `/lists/smart/view/${slug}`,
    },
    official: (slug: string): `/lists/official/${string}` =>
      `/lists/official/${slug}`,
    home: (): '/users/me/lists' => '/users/me/lists',
    watchlist: (user: string): `/users/${string}/watchlist` =>
      `/users/${user}/watchlist`,
    all: (
      user: string,
      type: PersonalListType,
      params: Pick<WellKnownQueryParams, 'sort_by' | 'sort_how'> = {},
    ) =>
      `${listsDrilldownFactory(user)(type)}${
        buildParamString(sanitizeParams(params))
      }`,
  },
  app: {
    android: () =>
      'https://play.google.com/store/apps/details?id=tv.trakt.trakt',
    ios: () => 'https://apps.apple.com/us/app/trakt/id1514873602',
    tvTime: () => 'https://tvtime.trakt.tv',
  },
  docs: {
    api: () => 'https://docs.trakt.tv',
  },
  github: {
    web: () => 'https://github.com/trakt/trakt-web',
    reportIssue: () => 'https://github.com/trakt/trakt-web/issues/new',
  },
  socialMedia: {
    reddit: () => 'https://www.reddit.com/r/trakt',
  },
  vip: () => '/vip',
  terms: () => '/terms',
  privacy: () => '/privacy',
  about: () => '/about',
  faq: {
    tvTime: () => '/faq/tv-time',
  },
  branding: () => '/branding',
  status: () => 'https://status.trakt.tv',
  renewVip: () => 'vip/renew',
  og: {
    support: (username?: string) => ogSupportFactory(username),
    forums: () => 'https://forums.trakt.tv/c/trakt',
    watchnow: (id: string) => `https://watchnow.trakt.tv/watchnow/${id}`,
    widgets: {
      yir: (slug: string, year: string) =>
        `https://widgets.trakt.tv/users/${slug}/yir.jpg?year=${year}`,
    },
  },
  settings: {
    general: () => '/settings',
    generalDetail: () => '/settings/general',
    account: () => '/settings/account',
    data: () => '/settings/data',
    apps: () => '/settings/apps',
    appsConnected: () => '/settings/apps/connected',
    appsApi: () => '/settings/apps/api',
    appsApiNew: () => '/settings/apps/api/new',
    appsApiDetail: (id: number | string) => `/settings/apps/api/${id}`,
    appsApiEdit: (id: number | string) => `/settings/apps/api/${id}/edit`,
    advanced: () => '/settings/advanced',
    preview: () => '/settings/preview',
    streamingServices: (
      params: { connection?: string; service?: string | null } = {},
    ) => `/settings/streaming-services${buildParamString(params)}`,
    streamingServicesDetail: (id: number | string) =>
      `/settings/streaming-services/${id}`,
    streamingServicesCallback: () => '/callback/streaming',
    plex: () => '/settings/plex',
  },
  external: {
    imdb: {
      person: (imdbId: string) => `https://www.imdb.com/name/${imdbId}`,
      media: (imdbId: string) => `https://www.imdb.com/title/${imdbId}`,
      season: imdbSeason,
    },
    tmdb: {
      media: (tmdbId: string, type: 'tv' | 'movie') =>
        `https://www.themoviedb.org/${type}/${tmdbId}`,
      season: tmdbSeason,
      episode: (
        { id, season, episode }: TmdbSeasonParams & { episode: number },
      ) => `${tmdbSeason({ id, season })}/episode/${episode}`,
    },
    x: (id: string) => `https://x.com/${id}`,
    instagram: (id: string) => `https://www.instagram.com/${id}`,
    facebook: (id: string) => `https://www.facebook.com/${id}`,
    wikipedia: (id: string) => `https://en.wikipedia.org/wiki/${id}`,
  },
  feedback: () => 'https://roadmap.trakt.tv',
  admin: () => 'https://admin.trakt.tv',
  api: {
    shareableImage: (type: 'movie' | 'show', slug: string) => {
      const basePath = `/api/shareable-image?type=${type}&slug=${slug}`;
      return {
        openGraph: () => `${basePath}&variant=open-graph`,
        feed: () => `${basePath}&variant=feed`,
        story: () => `${basePath}&variant=story`,
      };
    },
  },
};
