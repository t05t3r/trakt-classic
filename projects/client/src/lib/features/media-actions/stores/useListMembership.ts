import { useSnapshot } from '$lib/features/query/useSnapshot.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import type { MediaListSummary } from '$lib/requests/models/MediaListSummary.ts';
import type { TargetMediaType } from '$lib/requests/models/TargetMediaType.ts';
import { addToListRequest } from '$lib/requests/queries/users/addToListRequest.ts';
import { removeFromListRequest } from '$lib/requests/queries/users/removeFromListRequest.ts';
import { userListItemIdsQuery } from '$lib/requests/queries/users/userListItemIdsQuery.ts';
import { toBulkPayload } from '$lib/requests/sync/toBulkPayload.ts';
import { toTargetKey } from '../_internal/toTargetKey.ts';
import { useOptimisticWrite } from '../_internal/useOptimisticWrite.ts';
import { withPendingOverride } from '../_internal/withPendingOverride.ts';

export type ListMembershipStoreProps = {
  list: MediaListSummary;
  type: TargetMediaType;
  id: number;
};

export function useListMembership(
  { list, type, id }: ListMembershipStoreProps,
) {
  const key = {
    action: 'list',
    targetKey: toTargetKey(type, id),
    listId: list.id,
  } as const;
  const body = toBulkPayload(type, [id]);
  const listItemsQuery = userListItemIdsQuery({
    userId: 'me',
    listId: list.id,
  });
  const listedKeys$ = useSnapshot(listItemsQuery, {
    select: (items) =>
      new Set(items.map((item) => toTargetKey(item.type, item.id))),
    whileUnsettled: 'hold',
  });
  const { value: isListed, isUpdating } = withPendingOverride({
    key,
    snapshot: listedKeys$,
    fromSnapshot: (listedKeys) => listedKeys?.has(key.targetKey),
  });
  const write = useOptimisticWrite().bind({
    keys: [key],
    invalidation: [InvalidateAction.ListedIn(list.id), InvalidateAction.Listed],
    keepUntil: [listItemsQuery.queryKey],
  });

  const add = () =>
    write({
      value: true,
      task: (params) => addToListRequest({ listId: list.id, body, ...params }),
    });

  const remove = () =>
    write({
      value: false,
      task: (params) =>
        removeFromListRequest({ listId: list.id, body, ...params }),
    });

  return { isListed, isUpdating, add, remove };
}
