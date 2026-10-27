import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { pendingOverrides } from '$lib/features/media-actions/_internal/pendingOverrides.ts';
import { toTargetKey } from '$lib/features/media-actions/_internal/toTargetKey.ts';
import { combineLatest, map } from 'rxjs';

export type IsDroppedProps = { id: number };

export function useIsDropped({ id }: IsDroppedProps) {
  const { dropped } = useUser();
  const override$ = pendingOverrides.lookup$({
    action: 'drop',
    targetKey: toTargetKey('show', id),
  });

  const isDropped = combineLatest([dropped, override$]).pipe(
    map(([$dropped, override]) => {
      if (override) return override.value === true;

      return $dropped?.shows.has(id);
    }),
  );

  const isUpdating = override$.pipe(map((override) => override !== undefined));

  return { isDropped, isUpdating };
}
