import { hasAired } from '$lib/utils/media/hasAired.ts';
import type { AirableTarget } from './hasTargetAired.ts';

export function hasAirDatePassed(
  { type, airDate }: Pick<AirableTarget, 'type' | 'airDate'>,
): boolean {
  if (airDate == null) return false;

  return hasAired({ type, effectiveReleaseDate: airDate });
}
