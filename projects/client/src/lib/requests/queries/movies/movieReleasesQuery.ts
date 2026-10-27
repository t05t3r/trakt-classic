import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { parseDateOnly } from '$lib/utils/date/parseDateOnly.ts';
import { time } from '$lib/utils/timing/time.ts';
import { z } from 'zod';

type MovieReleasesParams = { slug: string } & ApiParams;

type MovieRelease = { release_date: string };

const movieReleasesRequest = (
  { fetch, slug }: MovieReleasesParams,
) =>
  api({ fetch })
    .movies
    .releases({
      params: {
        id: slug,
      },
    });

function mapToEarliestRelease(
  releases: ReadonlyArray<MovieRelease>,
): Date | null {
  return releases
    .map((release) => parseDateOnly(release.release_date))
    .filter((date): date is Date => date != null)
    .reduce<Date | null>(
      (earliest, date) => earliest == null || date < earliest ? date : earliest,
      null,
    );
}

export const movieReleasesQuery = defineQuery({
  key: 'movieReleases',
  invalidations: [],
  dependencies: (params) => [params.slug],
  request: movieReleasesRequest,
  mapper: (response) => mapToEarliestRelease(response.body),
  schema: z.date().nullable(),
  ttl: time.hours(12),
});
