import { PLACEHOLDERS } from '$lib/features/image/placeholders.ts';
import { toSectionStatus } from '$lib/features/query/toSectionStatus.ts';
import { useQuery } from '$lib/features/query/useQuery.ts';
import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
import type { TraktRatingSummary } from '$lib/requests/models/MediaRating.ts';
import type { Season } from '$lib/requests/models/Season.ts';
import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';
import type { ShowProgressDetail } from '$lib/requests/models/ShowProgressDetail.ts';
import { showProgressQuery } from '$lib/requests/queries/shows/showProgressQuery.ts';
import { showSeasonEpisodesQuery } from '$lib/requests/queries/shows/showSeasonEpisodesQuery.ts';
import { showSeasonListsQuery } from '$lib/requests/queries/shows/showSeasonListsQuery.ts';
import { showSeasonPeopleQuery } from '$lib/requests/queries/shows/showSeasonPeopleQuery.ts';
import { showSeasonsQuery } from '$lib/requests/queries/shows/showSeasonsQuery.ts';
import { showSeasonStatsQuery } from '$lib/requests/queries/shows/showSeasonStatsQuery.ts';
import { showSeasonSummaryQuery } from '$lib/requests/queries/shows/showSeasonSummaryQuery.ts';
import { showSummaryQuery } from '$lib/requests/queries/shows/showSummaryQuery.ts';
import { isEmpty } from '$lib/utils/array/isEmpty.ts';
import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
import { combineLatest, type Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DEFAULT_SEASONS_SORT } from '../_internal/DEFAULT_SEASONS_SORT.ts';
import { sortSeasons } from '../_internal/sortSeasons.ts';
import { type Neighbours, toNeighbours } from '../_internal/toNeighbours.ts';
import { hasNoMembers } from './_internal/hasNoMembers.ts';
import { toAirYear } from './_internal/toAirYear.ts';
import { toCommentsStatus } from './_internal/toCommentsStatus.ts';
import { toRegularsGroups } from './_internal/toRegularsGroups.ts';
import { useListsStatus } from './_internal/useListsStatus.ts';
import { type Tagged, useTaggedQuery } from './_internal/useTaggedQuery.ts';

export type SeasonParams = {
  slug: string;
  season: number;
};

// Null, not undefined, so a season the progress does not list reads as empty, not loading.
const toSeasonEntry = (season: number) => ({ seasons }: ShowProgressDetail) =>
  seasons.find(({ number }) => number === season) ?? null;

const toPoster = (
  season: Season | Nil,
  show: ShowEntry | undefined,
): ImageUrl => {
  if (!season) return PLACEHOLDERS.poster;

  return season.poster?.url.thumb ?? show?.poster.url.thumb ??
    PLACEHOLDERS.poster;
};

type SeasonRatings = { trakt: TraktRatingSummary };

const toRatings = (season: Season | Nil): SeasonRatings | undefined => {
  if (!season) return undefined;
  if (season.rating == null || season.votes == null) return undefined;

  return { trakt: { rating: season.rating, votes: season.votes } };
};

const toSeasonRegularsGroups = toRegularsGroups('seasonRegulars');

// Links wait for the seasons to be read for the current show, so none is built from the list the previous show left.
const toSeasonNeighbours = (
  { slug, season }: SeasonParams,
  { read, result }: Tagged<SeasonParams, ReadonlyArray<Season>>,
): Neighbours => {
  if (read.slug !== slug || !result.data) return {};

  return toNeighbours({ slug, seasons: result.data, season });
};

export function useSeason(params$: Observable<SeasonParams>) {
  const season = useQuery(
    params$.pipe(map((params) => showSeasonSummaryQuery(params))),
  );
  const show = useQuery(
    params$.pipe(map(({ slug }) => showSummaryQuery({ slug }))),
  );
  const stats = useQuery(
    params$.pipe(map((params) => showSeasonStatsQuery(params))),
  );
  const crew = useQuery(
    params$.pipe(map((params) => showSeasonPeopleQuery(params))),
  );
  const progress = useQuery(
    params$.pipe(map(({ slug }) => showProgressQuery({ slug }))),
  );
  const episodes = useQuery(
    params$.pipe(map((params) => showSeasonEpisodesQuery(params))),
  );
  const seasons = useTaggedQuery(
    params$,
    ({ slug }) => showSeasonsQuery({ slug }),
  );

  return {
    season: season.pipe(map(($season) => $season.data)),
    year: season.pipe(
      map(($season) => $season.data ? toAirYear($season.data) : undefined),
    ),
    show: show.pipe(map(($show) => $show.data)),
    poster: combineLatest([season, show]).pipe(
      map(([$season, $show]) => toPoster($season.data, $show.data)),
    ),
    ratings: season.pipe(map(($season) => toRatings($season.data))),
    stats: stats.pipe(map(($stats) => $stats.data)),
    commentsStatus: stats.pipe(map(toCommentsStatus)),
    castStatus: crew.pipe(
      map((result) =>
        toSectionStatus({
          result,
          select: toSeasonRegularsGroups,
          isEmpty: hasNoMembers,
        })
      ),
    ),
    episodesStatus: episodes.pipe(
      map((result) => toSectionStatus({ result, isEmpty })),
    ),
    episodeCount: episodes.pipe(map(($episodes) => $episodes.data?.length)),
    // The progress leaves the specials out, so season 0 has no entry to read.
    progressStatus: combineLatest([params$, progress]).pipe(
      map(([{ season }, result]) =>
        season === SPECIALS ? undefined : toSectionStatus({
          result,
          select: toSeasonEntry(season),
          isEmpty: (entry) => entry === null,
        })
      ),
    ),
    seasons: seasons.pipe(
      map(({ result }) =>
        sortSeasons({
          items: result.data ?? [],
          sort: DEFAULT_SEASONS_SORT,
        })
      ),
    ),
    neighbours: combineLatest([params$, seasons]).pipe(
      map(([params, $seasons]) => toSeasonNeighbours(params, $seasons)),
    ),
    listsStatus: useListsStatus((type) =>
      params$.pipe(map((params) => showSeasonListsQuery({ ...params, type })))
    ),
  };
}
