import { defineQuery } from '$lib/features/query/defineQuery.ts';
import { mapToUserStats } from '$lib/requests/_internal/mapToUserStats.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { UserStatsSchema } from '$lib/requests/models/UserStats.ts';
import { time } from '$lib/utils/timing/time.ts';

type UserStatsParams = { slug: string } & ApiParams;

const userStatsRequest = (
  { fetch, slug }: UserStatsParams,
) =>
  api({ fetch })
    .users
    .stats({
      params: {
        id: slug,
      },
    });

export const userStatsQuery = defineQuery({
  key: 'userStats',
  invalidations: [
    InvalidateAction.MarkAsWatched('movie'),
    InvalidateAction.MarkAsWatched('show'),
    InvalidateAction.MarkAsWatched('episode'),
  ],
  dependencies: (params) => [params.slug],
  request: userStatsRequest,
  mapper: (response) => mapToUserStats(response.body),
  schema: UserStatsSchema,
  ttl: time.minutes(30),
});
