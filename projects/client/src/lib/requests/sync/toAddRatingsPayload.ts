import type { TargetMediaType } from '$lib/requests/models/TargetMediaType.ts';
import type { RatingsSyncRequest } from '@trakt/api';

type RatedTarget = {
  id: number;
  rating: number;
};

export function toAddRatingsPayload(
  type: TargetMediaType,
  targets: ReadonlyArray<RatedTarget>,
): RatingsSyncRequest {
  const entries = targets.map(({ id, rating }) => ({
    ids: { trakt: id },
    rating,
  }));

  switch (type) {
    case 'movie':
      return { movies: entries };
    case 'show':
      return { shows: entries };
    case 'season':
      return { seasons: entries };
    case 'episode':
      return { episodes: entries };
  }
}
