import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { pendingOverrides } from '$lib/features/media-actions/_internal/pendingOverrides.ts';
import { toTargetKey } from '$lib/features/media-actions/_internal/toTargetKey.ts';
import type { TargetMediaType } from '$lib/requests/models/TargetMediaType.ts';
import { combineLatest, map } from 'rxjs';

export type IsWatchlistedProps = {
  type: TargetMediaType;
  id: number;
};

export function useIsWatchlisted({ type, id }: IsWatchlistedProps) {
  const { watchlist } = useUser();
  const override$ = pendingOverrides.lookup$({
    action: 'watchlist',
    targetKey: toTargetKey(type, id),
  });

  const isWatchlisted = combineLatest([watchlist, override$]).pipe(
    map(([$watchlist, override]) => {
      if (override) return override.value === true;

      return $watchlist?.[`${type}s` as const].has(id);
    }),
  );

  const isUpdating = override$.pipe(map((override) => override !== undefined));

  return { isWatchlisted, isUpdating };
}
