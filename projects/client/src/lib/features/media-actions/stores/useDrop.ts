import { ConfirmationType } from '$lib/features/confirmation/models/ConfirmationType.ts';
import { useConfirm } from '$lib/features/confirmation/useConfirm.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { dropShowRequest } from '$lib/requests/queries/users/dropShowRequest.ts';
import { restoreShowRequest } from '$lib/requests/queries/users/restoreShowRequest.ts';
import { toBulkPayload } from '$lib/requests/sync/toBulkPayload.ts';
import { toTargetKey } from '../_internal/toTargetKey.ts';
import { useOptimisticWrite } from '../_internal/useOptimisticWrite.ts';
import { useIsDropped } from './_internal/useIsDropped.ts';

export type DropStoreProps = { id: number; title: string };

export function useDrop({ id, title }: DropStoreProps) {
  const key = { action: 'drop', targetKey: toTargetKey('show', id) } as const;
  const body = toBulkPayload('show', [id]);
  const { run } = useOptimisticWrite();
  const { confirmAsync } = useConfirm();
  const { isDropped, isUpdating } = useIsDropped({ id });

  const drop = () =>
    run({
      keys: [key],
      value: true,
      task: (params) => dropShowRequest({ body, ...params }),
      invalidation: InvalidateAction.Drop('show'),
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
      task: (params) => restoreShowRequest({ body, ...params }),
      invalidation: InvalidateAction.Restore,
    });
  };

  return { isDropped, isUpdating, drop, restore };
}
