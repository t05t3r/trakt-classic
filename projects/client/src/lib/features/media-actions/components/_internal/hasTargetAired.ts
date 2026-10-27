import { hasAired } from '$lib/utils/media/hasAired.ts';
import type { QuickActionsTarget } from '../QuickActionsProps.ts';

type ShowTarget = Extract<QuickActionsTarget, { type: 'show' }>;
type SeasonTarget = Extract<QuickActionsTarget, { type: 'season' }>;

type AirableTarget =
  | Pick<
    Exclude<QuickActionsTarget, ShowTarget | SeasonTarget>,
    'type' | 'airDate'
  >
  | Pick<ShowTarget, 'type' | 'airDate'> & {
    episode: Pick<ShowTarget['episode'], 'count'>;
  }
  | Pick<SeasonTarget, 'type' | 'airDate'> & {
    episodes: Pick<SeasonTarget['episodes'], 'aired'>;
  };

export function hasTargetAired(target: AirableTarget): boolean {
  if (target.airDate == null) return false;
  // A show or season with no aired episode has nothing to mark watched, whatever its air date.
  if (target.type === 'show' && target.episode.count === 0) return false;
  if (target.type === 'season' && target.episodes.aired === 0) return false;

  return hasAired({ type: target.type, effectiveReleaseDate: target.airDate });
}
