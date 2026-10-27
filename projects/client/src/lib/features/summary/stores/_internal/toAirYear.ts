import { isKnownDate } from '$lib/utils/date/isKnownDate.ts';

export function toAirYear({ airDate }: { airDate: Date }): number | undefined {
  return isKnownDate(airDate) ? airDate.getFullYear() : undefined;
}
