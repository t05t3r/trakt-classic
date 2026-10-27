import { toSectionStatus } from '$lib/features/query/toSectionStatus.ts';
import { useQuery } from '$lib/features/query/useQuery.ts';
import type { MovieEntry } from '$lib/requests/models/MovieEntry.ts';
import { movieOfficialListQuery } from '$lib/requests/queries/movies/movieOfficialListQuery.ts';
import { moviePeopleQuery } from '$lib/requests/queries/movies/moviePeopleQuery.ts';
import { movieRatingQuery } from '$lib/requests/queries/movies/movieRatingQuery.ts';
import { movieListsQuery } from '$lib/requests/queries/movies/movieListsQuery.ts';
import { movieRelatedQuery } from '$lib/requests/queries/movies/movieRelatedQuery.ts';
import { movieReleasesQuery } from '$lib/requests/queries/movies/movieReleasesQuery.ts';
import { movieStatsQuery } from '$lib/requests/queries/movies/movieStatsQuery.ts';
import { movieStudiosQuery } from '$lib/requests/queries/movies/movieStudiosQuery.ts';
import { movieSummaryQuery } from '$lib/requests/queries/movies/movieSummaryQuery.ts';
import { isEmpty } from '$lib/utils/array/isEmpty.ts';
import { combineLatest, type Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EMPTY_CREW } from './_internal/EMPTY_CREW.ts';
import { hasNoMembers } from './_internal/hasNoMembers.ts';
import { toCastGroups } from './_internal/toCastGroups.ts';
import { toCommentsStatus } from './_internal/toCommentsStatus.ts';
import { toEarliestReleaseDate } from './_internal/toEarliestReleaseDate.ts';
import { useListsStatus } from './_internal/useListsStatus.ts';

const toRelatedCards = (
  movies: ReadonlyArray<MovieEntry>,
): ReadonlyArray<{ type: 'movie'; movie: MovieEntry }> =>
  movies.map((movie) => ({ type: 'movie', movie }));

export function useMovie(slug$: Observable<string>) {
  const movie = useQuery(
    slug$.pipe(map((slug) => movieSummaryQuery({ slug }))),
  );

  const studios = useQuery(
    slug$.pipe(map((slug) => movieStudiosQuery({ slug }))),
  );
  const stats = useQuery(slug$.pipe(map((slug) => movieStatsQuery({ slug }))));
  const crew = useQuery(slug$.pipe(map((slug) => moviePeopleQuery({ slug }))));
  const officialList = useQuery(
    slug$.pipe(map((slug) => movieOfficialListQuery({ slug }))),
  );
  const ratings = useQuery(
    slug$.pipe(map((slug) => movieRatingQuery({ slug }))),
  );
  const releases = useQuery(
    slug$.pipe(map((slug) => movieReleasesQuery({ slug }))),
  );
  const related = useQuery(
    slug$.pipe(map((slug) => movieRelatedQuery({ slug }))),
  );

  return {
    movie: movie.pipe(map(($movie) => $movie.data)),
    studios: studios.pipe(map(($studios) => $studios.data ?? [])),
    stats: stats.pipe(map(($stats) => $stats.data)),
    commentsStatus: stats.pipe(map(toCommentsStatus)),
    crew: crew.pipe(map(($crew) => $crew.data ?? EMPTY_CREW)),
    castStatus: crew.pipe(
      map((result) =>
        toSectionStatus({ result, select: toCastGroups, isEmpty: hasNoMembers })
      ),
    ),
    officialList: officialList.pipe(map(($list) => $list.data)),
    ratings: ratings.pipe(map(($ratings) => $ratings.data)),
    earliestReleaseDate: combineLatest([movie, releases]).pipe(
      map(([$movie, $releases]) => {
        if ($movie.data == null || $releases.isPending) return undefined;

        // A failed releases read leaves no data, so the summary's date stands.
        return toEarliestReleaseDate({
          earliestRelease: $releases.data,
          released: $movie.data.effectiveReleaseDate,
        });
      }),
    ),
    relatedStatus: related.pipe(
      map((result) =>
        toSectionStatus({ result, select: toRelatedCards, isEmpty })
      ),
    ),
    listsStatus: useListsStatus((type) =>
      slug$.pipe(map((slug) => movieListsQuery({ slug, type })))
    ),
  };
}
