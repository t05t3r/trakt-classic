import type { QuickActionsTarget } from '../QuickActionsProps.ts';
import { canAddPlay } from './canAddPlay.ts';
import { hasAirDatePassed } from './hasAirDatePassed.ts';

type ShowTarget = Extract<QuickActionsTarget, { type: 'show' }>;
type SeasonTarget = Extract<QuickActionsTarget, { type: 'season' }>;

export type AirableTarget =
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
  return hasAirDatePassed(target) && canAddPlay(target);
}
