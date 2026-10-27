import type { CastGroup } from '$lib/features/summary/_internal/CastGroup.ts';
import type { MediaCrew } from '$lib/requests/models/MediaCrew.ts';

export function toCastGroups({ cast }: MediaCrew): ReadonlyArray<CastGroup> {
  return [{ key: 'cast', members: cast }];
}
