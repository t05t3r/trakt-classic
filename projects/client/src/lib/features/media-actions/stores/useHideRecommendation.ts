import { useInvalidator } from '$lib/features/query/useInvalidator.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import type { MediaType } from '$lib/requests/models/MediaType.ts';
import { hideRecommendedMovieRequest } from '$lib/requests/queries/recommendations/hideRecommendedMovieRequest.ts';
import { hideRecommendedShowRequest } from '$lib/requests/queries/recommendations/hideRecommendedShowRequest.ts';
import { map, type Observable } from 'rxjs';
import type { WriteTask } from '../_internal/createWriteQueue.ts';
import { getWriteQueueContext } from '../_internal/getWriteQueueContext.ts';
import { hiddenRecommendations } from '../_internal/hiddenRecommendations.ts';
import { notifyWriteFailure } from '../_internal/notifyWriteFailure.ts';
import { toTargetKey } from '../_internal/toTargetKey.ts';

export type HideTarget = { type: MediaType; id: number; slug: string };

const toHideTask = ({ type, slug }: HideTarget): WriteTask => (params) =>
  type === 'show'
    ? hideRecommendedShowRequest({ slug, ...params })
    : hideRecommendedMovieRequest({ slug, ...params });

export function useHideRecommendation(): {
  isHidden: Observable<(target: Pick<HideTarget, 'type' | 'id'>) => boolean>;
  hide: (target: HideTarget) => Promise<void>;
} {
  const queue = getWriteQueueContext();
  const { invalidate } = useInvalidator();

  const isHidden = hiddenRecommendations.keys$.pipe(
    map((hidden) => ({ type, id }: Pick<HideTarget, 'type' | 'id'>) =>
      hidden.has(toTargetKey(type, id))
    ),
  );

  const hide = async (target: HideTarget): Promise<void> => {
    // Checked and set before the first await: the card leaves at once, and a repeat sends nothing.
    const targetKey = toTargetKey(target.type, target.id);
    if (hiddenRecommendations.has(targetKey)) return;

    hiddenRecommendations.add(targetKey);
    try {
      await queue.enqueue(toHideTask(target));
    } catch (error) {
      hiddenRecommendations.remove(targetKey);
      notifyWriteFailure(error);
      return;
    }

    await invalidate(InvalidateAction.HideRecommended(target.type));
  };

  return { isHidden, hide };
}
