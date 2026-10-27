import { toSectionStatus } from '$lib/features/query/toSectionStatus.ts';
import { useQuery } from '$lib/features/query/useQuery.ts';
import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';
import type { ShowProgressDetail } from '$lib/requests/models/ShowProgressDetail.ts';
import { showPeopleQuery } from '$lib/requests/queries/shows/showPeopleQuery.ts';
import { showProgressQuery } from '$lib/requests/queries/shows/showProgressQuery.ts';
import { showRatingQuery } from '$lib/requests/queries/shows/showRatingQuery.ts';
import { showSeasonsQuery } from '$lib/requests/queries/shows/showSeasonsQuery.ts';
import { showListsQuery } from '$lib/requests/queries/shows/showListsQuery.ts';
import { showRelatedQuery } from '$lib/requests/queries/shows/showRelatedQuery.ts';
import { showStatsQuery } from '$lib/requests/queries/shows/showStatsQuery.ts';
import { showStudiosQuery } from '$lib/requests/queries/shows/showStudiosQuery.ts';
import { showSummaryQuery } from '$lib/requests/queries/shows/showSummaryQuery.ts';
import { isEmpty } from '$lib/utils/array/isEmpty.ts';
import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { seasonsWithEpisodes } from '../_internal/seasonsWithEpisodes.ts';
import { EMPTY_CREW } from './_internal/EMPTY_CREW.ts';
import { hasNoMembers } from './_internal/hasNoMembers.ts';
import { toCommentsStatus } from './_internal/toCommentsStatus.ts';
import { toRegularsGroups } from './_internal/toRegularsGroups.ts';
import { useListsStatus } from './_internal/useListsStatus.ts';

const toRelatedCards = (
  shows: ReadonlyArray<ShowEntry>,
): ReadonlyArray<{ type: 'show'; show: ShowEntry }> =>
  shows.map((show) => ({ type: 'show', show }));

// Trakt answers a show with no plays with its aired count and none completed.
const hasNoPlays = ({ completed }: ShowProgressDetail) => completed === 0;

const toShowRegularsGroups = toRegularsGroups('regulars');

export function useShow(slug$: Observable<string>) {
  const show = useQuery(slug$.pipe(map((slug) => showSummaryQuery({ slug }))));
  const seasons = useQuery(
    slug$.pipe(map((slug) => showSeasonsQuery({ slug }))),
  );
  const studios = useQuery(
    slug$.pipe(map((slug) => showStudiosQuery({ slug }))),
  );
  const stats = useQuery(slug$.pipe(map((slug) => showStatsQuery({ slug }))));
  const crew = useQuery(slug$.pipe(map((slug) => showPeopleQuery({ slug }))));
  const progress = useQuery(
    slug$.pipe(map((slug) => showProgressQuery({ slug }))),
  );
  const ratings = useQuery(
    slug$.pipe(map((slug) => showRatingQuery({ slug }))),
  );
  const related = useQuery(
    slug$.pipe(map((slug) => showRelatedQuery({ slug }))),
  );

  return {
    show: show.pipe(map(($show) => $show.data)),
    studios: studios.pipe(map(($studios) => $studios.data ?? [])),
    stats: stats.pipe(map(($stats) => $stats.data)),
    commentsStatus: stats.pipe(map(toCommentsStatus)),
    crew: crew.pipe(map(($crew) => $crew.data ?? EMPTY_CREW)),
    castStatus: crew.pipe(
      map((result) =>
        toSectionStatus({
          result,
          select: toShowRegularsGroups,
          isEmpty: hasNoMembers,
        })
      ),
    ),
    seasonsStatus: seasons.pipe(
      map((result) =>
        toSectionStatus({ result, select: seasonsWithEpisodes, isEmpty })
      ),
    ),
    seasonCount: seasons.pipe(
      map(($seasons) =>
        $seasons.data &&
        seasonsWithEpisodes($seasons.data)
          .filter(({ number }) => number > SPECIALS).length
      ),
    ),
    progress: progress.pipe(map(($progress) => $progress.data)),
    progressStatus: progress.pipe(
      map((result) => toSectionStatus({ result, isEmpty: hasNoPlays })),
    ),
    ratings: ratings.pipe(map(($ratings) => $ratings.data)),
    earliestReleaseDate: show.pipe(
      map(($show) => $show.data?.effectiveReleaseDate),
    ),
    relatedStatus: related.pipe(
      map((result) =>
        toSectionStatus({ result, select: toRelatedCards, isEmpty })
      ),
    ),
    listsStatus: useListsStatus((type) =>
      slug$.pipe(map((slug) => showListsQuery({ slug, type })))
    ),
  };
}
