import { api, type ApiParams } from '$lib/requests/api.ts';

type ReorderUserListsParams = {
  userId: string | number;
  rank: number[];
} & ApiParams;

export function reorderUserListsRequest(
  { fetch, userId, rank }: ReorderUserListsParams,
): Promise<boolean> {
  return api({ fetch })
    .users
    .lists
    .reorder({
      params: { id: `${userId}` },
      body: { rank },
    })
    .then((response) => response.status === 200);
}
