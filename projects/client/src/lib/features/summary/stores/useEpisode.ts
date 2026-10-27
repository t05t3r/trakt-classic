import { isPlaceholder } from '$lib/features/image/isPlaceholder.ts';
import { PLACEHOLDERS } from '$lib/features/image/placeholders.ts';
import { toSectionStatus } from '$lib/features/query/toSectionStatus.ts';
import { useQuery } from '$lib/features/query/useQuery.ts';
import { episodeListsQuery } from '$lib/requests/queries/episode/episodeListsQuery.ts';
import { episodePeopleQuery } from '$lib/requests/queries/episode/episodePeopleQuery.ts';
import { episodeRatingQuery } from '$lib/requests/queries/episode/episodeRatingQuery.ts';
import { episodeStatsQuery } from '$lib/requests/queries/episode/episodeStatsQuery.ts';
import { episodeSummaryQuery } from '$lib/requests/queries/episode/episodeSummaryQuery.ts';
import { showSeasonEpisodesQuery } from '$lib/requests/queries/shows/showSeasonEpisodesQuery.ts';
import { showSeasonsQuery } from '$lib/requests/queries/shows/showSeasonsQuery.ts';
import { showSummaryQuery } from '$lib/requests/queries/shows/showSummaryQuery.ts';
import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
import type { CastMember, MediaCrew } from '$lib/requests/models/MediaCrew.ts';
import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
import type { Season } from '$lib/requests/models/Season.ts';
import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';
import { combineLatest, type Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { adjacentSeasons } from '../_internal/adjacentSeasons.ts';
import { DEFAULT_EPISODES_SORT } from '../_internal/DEFAULT_EPISODES_SORT.ts';
import { sortEpisodes } from '../_internal/sortEpisodes.ts';
import {
  type Neighbours,
  type SeasonEpisodes,
  toNeighbours,
} from '../_internal/toNeighbours.ts';
import { EMPTY_CREW } from './_internal/EMPTY_CREW.ts';
import { hasNoMembers } from './_internal/hasNoMembers.ts';
import { toAirYear } from './_internal/toAirYear.ts';
import { toCommentsStatus } from './_internal/toCommentsStatus.ts';
import { isSameRead, type SeasonRead } from './_internal/isSameRead.ts';
import { listFor } from './_internal/listFor.ts';
import { toRegularsGroups } from './_internal/toRegularsGroups.ts';
import { useListsStatus } from './_internal/useListsStatus.ts';
import {
  type EpisodesRead,
  useSeasonEpisodes,
} from './_internal/useSeasonEpisodes.ts';
import { type Tagged, useTaggedQuery } from './_internal/useTaggedQuery.ts';

export type EpisodeParams = {
  slug: string;
  season: number;
  episode: number;
};

// Classic leaves an episode's cast cells without an episode count.
const withoutEpisodeCount = (
  { episodeCount: _, ...member }: CastMember,
): CastMember => member;

const toSeasonRegularsGroups = toRegularsGroups('seasonRegulars');

const toEpisodeCastGroups = ({ cast, guestStars }: MediaCrew) =>
  toSeasonRegularsGroups({
    cast: cast.map(withoutEpisodeCount),
    guestStars: guestStars.map(withoutEpisodeCount),
  });

const toBackdrop = (
  episode: EpisodeEntry | undefined,
  show: ShowEntry | undefined,
) => {
  if (!episode) return undefined;
  if (!isPlaceholder(episode.cover.url.full)) return episode.cover.url.full;

  return show?.cover.url.full;
};

type SeasonPoster = { src: ImageUrl; seasonId?: number };

type SeasonPosterInput = {
  params: EpisodeParams;
  show: ShowEntry | undefined;
  seasons: Tagged<EpisodeParams, ReadonlyArray<Season>>;
};

// A seasons list another show left reads as loading, so no poster comes from it.
const toSeasonPoster = (
  { params, show, seasons }: SeasonPosterInput,
): SeasonPoster => {
  if (!show || seasons.read.slug !== params.slug) {
    return { src: PLACEHOLDERS.poster };
  }
  if (seasons.result.status === 'pending') return { src: PLACEHOLDERS.poster };

  const entry = seasons.result.data
    ?.find(({ number }) => number === params.season);
  if (!entry) return { src: show.poster.url.thumb };

  return {
    src: entry.poster?.url.thumb ?? show.poster.url.thumb,
    seasonId: entry.id,
  };
};

type AdjacentReads = {
  params: EpisodeParams;
  previous?: SeasonRead;
  next?: SeasonRead;
};

const seasonRead = (
  slug: string,
  season: number | undefined,
): SeasonRead | undefined =>
  season === undefined ? undefined : { slug, season };

// Only a seasons list read for the params' show names the seasons either side.
const toAdjacentReads = (
  { params, seasons }: {
    params: EpisodeParams;
    seasons: Tagged<EpisodeParams, ReadonlyArray<Season>>;
  },
): AdjacentReads | undefined => {
  if (seasons.read.slug !== params.slug) return undefined;
  if (!seasons.result.data) return undefined;

  const { previous, next } = adjacentSeasons({
    seasons: seasons.result.data,
    season: params.season,
  });

  return {
    params,
    previous: seasonRead(params.slug, previous),
    next: seasonRead(params.slug, next),
  };
};

const crossing = (
  list: EpisodesRead | undefined,
  read: SeasonRead | undefined,
): SeasonEpisodes | undefined => {
  if (!read) return undefined;

  const episodes = listFor(list, read)?.data;
  if (!episodes) return undefined;

  return { season: read.season, episodes };
};

type NeighboursInput = {
  params: EpisodeParams;
  adjacent: AdjacentReads | undefined;
  episodes: Tagged<EpisodeParams, ReadonlyArray<EpisodeEntry>>;
  previousSeason: EpisodesRead | undefined;
  nextSeason: EpisodesRead | undefined;
};

// Each link waits only for the lists it uses, each read for the current params, so none comes from a list
// the previous params left; a link across a season end also waits for that side's list, and a failed one links nothing past it.
const toEpisodeNeighbours = (
  { params, adjacent, episodes, previousSeason, nextSeason }: NeighboursInput,
): Neighbours => {
  if (!isSameRead(episodes.read, params)) return {};
  if (!episodes.result.data) return {};

  const reads = adjacent && isSameRead(adjacent.params, params)
    ? adjacent
    : undefined;

  return toNeighbours({
    slug: params.slug,
    season: params.season,
    episode: {
      number: params.episode,
      episodes: episodes.result.data,
      previousSeason: crossing(previousSeason, reads?.previous),
      nextSeason: crossing(nextSeason, reads?.next),
    },
  });
};

export function useEpisode(params$: Observable<EpisodeParams>) {
  const episode = useQuery(
    params$.pipe(map((params) => episodeSummaryQuery(params))),
  );
  const show = useQuery(
    params$.pipe(map(({ slug }) => showSummaryQuery({ slug }))),
  );
  const seasons = useTaggedQuery(
    params$,
    ({ slug }) => showSeasonsQuery({ slug }),
  );
  const episodes = useTaggedQuery(
    params$,
    ({ slug, season }) => showSeasonEpisodesQuery({ slug, season }),
  );
  // Shared, so the adjacent lists and the links take their seasons from one computation.
  const adjacent = combineLatest([params$, seasons]).pipe(
    map(([params, $seasons]) => toAdjacentReads({ params, seasons: $seasons })),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  const previousSeason = useSeasonEpisodes(
    adjacent.pipe(map((reads) => reads?.previous)),
  );
  const nextSeason = useSeasonEpisodes(
    adjacent.pipe(map((reads) => reads?.next)),
  );
  const stats = useQuery(
    params$.pipe(map((params) => episodeStatsQuery(params))),
  );
  const ratings = useQuery(
    params$.pipe(map((params) => episodeRatingQuery(params))),
  );
  const crew = useQuery(
    params$.pipe(map((params) => episodePeopleQuery(params))),
  );

  return {
    episode: episode.pipe(map(($episode) => $episode.data)),
    year: episode.pipe(
      map(($episode) => $episode.data && toAirYear($episode.data)),
    ),
    backdrop: combineLatest([episode, show]).pipe(
      map(([$episode, $show]) => toBackdrop($episode.data, $show.data)),
    ),
    show: show.pipe(map(($show) => $show.data)),
    seasonPoster: combineLatest([params$, show, seasons]).pipe(
      map(([params, $show, $seasons]) =>
        toSeasonPoster({ params, show: $show.data, seasons: $seasons })
      ),
    ),
    stats: stats.pipe(map(($stats) => $stats.data)),
    commentsStatus: stats.pipe(map(toCommentsStatus)),
    ratings: ratings.pipe(map(($ratings) => $ratings.data)),
    crew: crew.pipe(map(($crew) => $crew.data ?? EMPTY_CREW)),
    castStatus: crew.pipe(
      map((result) =>
        toSectionStatus({
          result,
          select: toEpisodeCastGroups,
          isEmpty: hasNoMembers,
        })
      ),
    ),
    earliestReleaseDate: episode.pipe(
      map(($episode) => $episode.data?.effectiveReleaseDate),
    ),
    episodes: episodes.pipe(
      map(({ result }) =>
        sortEpisodes({
          items: result.data ?? [],
          sort: DEFAULT_EPISODES_SORT,
        })
      ),
    ),
    neighbours: combineLatest({
      params: params$,
      adjacent,
      episodes,
      previousSeason,
      nextSeason,
    }).pipe(map(toEpisodeNeighbours)),
    listsStatus: useListsStatus((type) =>
      params$.pipe(map((params) => episodeListsQuery({ ...params, type })))
    ),
  };
}
