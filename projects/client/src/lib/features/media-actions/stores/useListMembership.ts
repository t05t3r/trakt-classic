import { useSnapshot } from '$lib/features/query/useSnapshot.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import type { MediaListSummary } from '$lib/requests/models/MediaListSummary.ts';
import type { TargetMediaType } from '$lib/requests/models/TargetMediaType.ts';
import { addToListRequest } from '$lib/requests/queries/users/addToListRequest.ts';
import { removeFromListRequest } from '$lib/requests/queries/users/removeFromListRequest.ts';
import { userListItemIdsQuery } from '$lib/requests/queries/users/userListItemIdsQuery.ts';
import { toBulkPayload } from '$lib/requests/sync/toBulkPayload.ts';
import { combineLatest, map } from 'rxjs';
import { pendingOverrides } from '../_internal/pendingOverrides.ts';
import { toTargetKey } from '../_internal/toTargetKey.ts';
import { useOptimisticWrite } from '../_internal/useOptimisticWrite.ts';

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
  const invalidation = [
    InvalidateAction.ListedIn(list.id),
    InvalidateAction.Listed,
  ];
  const { run } = useOptimisticWrite();
  const override$ = pendingOverrides.lookup$(key);
  const listedKeys$ = useSnapshot(
    userListItemIdsQuery({ userId: 'me', listId: list.id }),
    {
      select: (items) =>
        new Set(items.map((item) => toTargetKey(item.type, item.id))),
      whileUnsettled: 'hold',
    },
  );

  const isListed = combineLatest([listedKeys$, override$]).pipe(
    map(([listedKeys, override]) => {
      if (override) return override.value === true;

      return listedKeys?.has(key.targetKey);
    }),
  );

  const isUpdating = override$.pipe(map((override) => override !== undefined));

  const add = () =>
    run({
      keys: [key],
      value: true,
      task: (params) => addToListRequest({ listId: list.id, body, ...params }),
      invalidation,
    });

  const remove = () =>
    run({
      keys: [key],
      value: false,
      task: (params) =>
        removeFromListRequest({ listId: list.id, body, ...params }),
      invalidation,
    });

  return { isListed, isUpdating, add, remove };
}
