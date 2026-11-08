import { api, type ApiParams } from '$lib/requests/api.ts';

type ReorderListParams = {
  userId: string | number;
  listId: string | number;
  rank: number[];
} & ApiParams;

export function reorderListRequest(
  { fetch, userId, listId, rank }: ReorderListParams,
): Promise<boolean> {
  return api({ fetch })
    .users
    .lists
    .list
    .reorderItems({
      params: {
        id: `${userId}`,
        list_id: `${listId}`,
      },
      body: { rank },
    })
    .then((response) => response.status === 200);
}
