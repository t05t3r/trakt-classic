import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { toTargetKey } from '$lib/features/media-actions/_internal/toTargetKey.ts';
import { withPendingOverride } from '$lib/features/media-actions/_internal/withPendingOverride.ts';
import type { TargetMediaType } from '$lib/requests/models/TargetMediaType.ts';

export type IsWatchlistedProps = {
  type: TargetMediaType;
  id: number;
};

export function useIsWatchlisted({ type, id }: IsWatchlistedProps) {
  const { watchlist } = useUser();
  const { value: isWatchlisted, isUpdating } = withPendingOverride({
    key: { action: 'watchlist', targetKey: toTargetKey(type, id) },
    snapshot: watchlist,
    fromSnapshot: ($watchlist) => $watchlist?.[`${type}s` as const].has(id),
  });

  return { isWatchlisted, isUpdating };
}
