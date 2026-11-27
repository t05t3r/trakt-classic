import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { toTargetKey } from '$lib/features/media-actions/_internal/toTargetKey.ts';
import { withPendingOverride } from '$lib/features/media-actions/_internal/withPendingOverride.ts';

export type IsDroppedProps = { id: number };

export function useIsDropped({ id }: IsDroppedProps) {
  const { dropped } = useUser();
  const { value: isDropped, isUpdating } = withPendingOverride({
    key: { action: 'drop', targetKey: toTargetKey('show', id) },
    snapshot: dropped,
    fromSnapshot: ($dropped) => $dropped?.shows.has(id),
  });

  return { isDropped, isUpdating };
}
