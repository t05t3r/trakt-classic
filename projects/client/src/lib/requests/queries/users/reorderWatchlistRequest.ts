import { api, type ApiParams } from '$lib/requests/api.ts';

type ReorderWatchlistParams = {
  rank: number[];
} & ApiParams;

export function reorderWatchlistRequest(
  { fetch, rank }: ReorderWatchlistParams,
): Promise<boolean> {
  return api({ fetch })
    .sync
    .watchlist
    .reorder({ body: { rank } })
    .then((response) => response.status === 200);
}
