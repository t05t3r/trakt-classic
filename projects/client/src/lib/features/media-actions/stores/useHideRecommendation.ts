import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import type { MediaType } from '$lib/requests/models/MediaType.ts';
import { hideRecommendedMovieRequest } from '$lib/requests/queries/recommendations/hideRecommendedMovieRequest.ts';
import { hideRecommendedShowRequest } from '$lib/requests/queries/recommendations/hideRecommendedShowRequest.ts';
import { map, type Observable } from 'rxjs';
import type { WriteTask } from '../_internal/createWriteQueue.ts';
import { pendingOverrides } from '../_internal/pendingOverrides.ts';
import { toTargetKey } from '../_internal/toTargetKey.ts';
import { useOptimisticWrite } from '../_internal/useOptimisticWrite.ts';

export type HideTarget = { type: MediaType; id: number; slug: string };

const toHideTask = ({ type, slug }: HideTarget): WriteTask => (params) =>
  type === 'show'
    ? hideRecommendedShowRequest({ slug, ...params })
    : hideRecommendedMovieRequest({ slug, ...params });

export function useHideRecommendation(): {
  isHidden: Observable<(target: Pick<HideTarget, 'type' | 'id'>) => boolean>;
  hide: (target: HideTarget) => Promise<boolean>;
} {
  const { run } = useOptimisticWrite();

  const isHidden = pendingOverrides.valuesOf$('hide').pipe(
    map((valueOf) => ({ type, id }: Pick<HideTarget, 'type' | 'id'>) =>
      valueOf(toTargetKey(type, id)) === true
    ),
  );

  const hide = (target: HideTarget): Promise<boolean> =>
    run({
      keys: [{
        action: 'hide',
        targetKey: toTargetKey(target.type, target.id),
      }],
      value: true,
      task: toHideTask(target),
      invalidation: InvalidateAction.HideRecommended(target.type),
      keepUntil: 'session',
    });

  return { isHidden, hide };
}
