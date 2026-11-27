import { currentUserDroppedQuery } from '$lib/features/auth/queries/currentUserDroppedQuery.ts';
import { ConfirmationType } from '$lib/features/confirmation/models/ConfirmationType.ts';
import { useConfirm } from '$lib/features/confirmation/useConfirm.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { upNextQuery } from '$lib/requests/queries/sync/upNextQuery.ts';
import { hideRequest } from '$lib/requests/queries/users/hideRequest.ts';
import { toBulkPayload } from '$lib/requests/sync/toBulkPayload.ts';
import { toDropPayload } from '$lib/requests/sync/toDropPayload.ts';
import { toTargetKey } from '../_internal/toTargetKey.ts';
import { useOptimisticWrite } from '../_internal/useOptimisticWrite.ts';
import { useIsDropped } from './_internal/useIsDropped.ts';

const READER_KEY = currentUserDroppedQuery().queryKey;
// Up Next hides a show with a Drop override, so a Drop waits on its read too; a Restore hides none.
const DROP_READERS = [READER_KEY, upNextQuery().queryKey];

export type DropStoreProps = { id: number; title: string };

export function useDrop({ id, title }: DropStoreProps) {
  const key = { action: 'drop', targetKey: toTargetKey('show', id) } as const;
  const body = toBulkPayload('show', [id]);
  const { run } = useOptimisticWrite();
  const { confirmAsync } = useConfirm();
  const { isDropped, isUpdating } = useIsDropped({ id });

  const drop = (at?: Date) =>
    run({
      keys: [key],
      value: true,
      task: (params) =>
        hideRequest({
          section: 'dropped',
          mode: 'add',
          body: at ? toDropPayload(id, at) : body,
          ...params,
        }),
      invalidation: InvalidateAction.Drop('show'),
      keepUntil: DROP_READERS,
    });

  const restore = async () => {
    const isConfirmed = await confirmAsync({
      type: ConfirmationType.RestoreShow,
      title,
    });
    if (!isConfirmed) return false;

    return run({
      keys: [key],
      value: false,
      task: (params) =>
        hideRequest({ section: 'dropped', mode: 'remove', body, ...params }),
      invalidation: InvalidateAction.Restore,
      keepUntil: [READER_KEY],
    });
  };

  return { isDropped, isUpdating, drop, restore };
}
