import { hasAirDatePassed } from './hasAirDatePassed.ts';
import type { AirableTarget } from './hasTargetAired.ts';

// A show or season with no aired episode has nothing to mark watched, whatever its air date.
export function canAddPlay(target: AirableTarget): boolean {
  if (target.type === 'show') return target.episode.count !== 0;
  if (target.type === 'season') return target.episodes.aired !== 0;

  return hasAirDatePassed(target);
}
