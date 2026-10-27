import type { TargetMediaType } from '$lib/requests/models/TargetMediaType.ts';
import type { RemoveRatingsParams } from '@trakt/api';

// Builds the sync/ratings/remove body for a set of trakt ids of a single media
// type. The computed `${type}s` key can't be verified against the union, hence
// the cast at the boundary.
export function toRemoveRatingsPayload(
  type: TargetMediaType,
  traktIds: ReadonlyArray<number>,
): RemoveRatingsParams {
  return {
    [`${type}s`]: traktIds.map((trakt) => ({ ids: { trakt } })),
  } as RemoveRatingsParams;
}
